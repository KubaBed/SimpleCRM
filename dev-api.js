import { readdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve, join } from 'node:path'

async function collectRoutes(dir, base = '') {
  const out = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    if (e.name.startsWith('_')) continue
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      const dirName = e.name.replace(/\[([^\]]+)\]/g, ':$1')
      out.push(...await collectRoutes(full, `${base}/${dirName}`))
    } else if (e.name.endsWith('.js')) {
      const name = e.name.replace(/\.js$/, '')
      // Convert filename like `leads_[id]` to route `leads/:id`
      const routeName = name === 'index' ? '' : name.replace(/_\[([^\]]+)\]/g, '/:$1').replace(/\[([^\]]+)\]/g, ':$1')
      out.push({ route: `${base}/${routeName}`, file: full })
    }
  }
  return out
}

function matchRoute(routePath, urlPath) {
  const rParts = routePath.split('/').filter(Boolean)
  const uParts = urlPath.split('/').filter(Boolean)
  if (rParts.length !== uParts.length) return null
  const params = {}
  for (let i = 0; i < rParts.length; i++) {
    if (rParts[i].startsWith(':')) {
      params[rParts[i].slice(1)] = decodeURIComponent(uParts[i])
    } else if (rParts[i] !== uParts[i]) {
      return null
    }
  }
  return params
}

function readBody(req) {
  return new Promise((resolveP, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) return resolveP(undefined)
      const ct = (req.headers['content-type'] || '').toLowerCase()
      if (ct.includes('application/json')) {
        try { resolveP(JSON.parse(raw)) } catch { resolveP(raw) }
      } else {
        resolveP(raw)
      }
    })
    req.on('error', reject)
  })
}

export default function devApi({ apiDir = 'api' } = {}) {
  return {
    name: 'dev-api',
    configureServer(server) {
      const apiPath = resolve(server.config.root, apiDir)
      const routesPromise = collectRoutes(apiPath).then(rs =>
        rs.map(r => ({ ...r, route: `/api${r.route}` }))
      )

      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next()
        try {
          const url = new URL(req.url, 'http://localhost')
          const pathname = url.pathname
          const routes = await routesPromise

          let match = null
          for (const r of routes) {
            const params = matchRoute(r.route, pathname)
            if (params) { match = { ...r, params }; break }
          }
          if (!match) return next()

          const mod = await server.ssrLoadModule(pathToFileURL(match.file).href)
          const handler = mod.default
          if (typeof handler !== 'function') {
            res.statusCode = 500
            res.end(JSON.stringify({ error: `No default export in ${match.file}` }))
            return
          }

          const body = await readBody(req)
          const query = { ...match.params, ...Object.fromEntries(url.searchParams) }

          // Vercel-style req/res shim
          const vReq = Object.assign(req, { query, body })
          const vRes = Object.assign(res, {
            status(code) { res.statusCode = code; return vRes },
            json(payload) {
              if (!res.getHeader('content-type')) res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify(payload))
              return vRes
            },
            send(payload) {
              if (typeof payload === 'object') return vRes.json(payload)
              res.end(String(payload))
              return vRes
            }
          })

          await handler(vReq, vRes)
        } catch (err) {
          console.error('[dev-api]', err)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ error: err.message || 'Internal error' }))
          }
        }
      })
    }
  }
}
