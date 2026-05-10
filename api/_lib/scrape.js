import { fetch } from 'undici'
import * as cheerio from 'cheerio'

const FETCH_TIMEOUT_MS = 12_000
const MAX_BYTES = 2 * 1024 * 1024
const USER_AGENT = 'SimpleCRM/1.0 (+brief generator)'
const SUBPAGE_PATHS = ['/o-nas', '/about', '/about-us', '/oferta', '/services', '/uslugi']

const PRIVATE_HOST_RE = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|::1$|0\.0\.0\.0$|fc00:|fe80:)/i

export class ScrapeError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function validateUrl(raw) {
  let u
  try {
    u = new URL(raw)
  } catch {
    throw new ScrapeError(400, 'Niepoprawny URL')
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new ScrapeError(400, 'URL musi być http(s)')
  }
  if (PRIVATE_HOST_RE.test(u.hostname)) {
    throw new ScrapeError(400, 'URL wskazuje na adres prywatny')
  }
  return u
}

async function fetchHtml(url, { timeoutMs = FETCH_TIMEOUT_MS } = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'user-agent': USER_AGENT,
        'accept': 'text/html,application/xhtml+xml',
        'accept-language': 'pl,en;q=0.9'
      },
      redirect: 'follow',
      signal: ctrl.signal
    })
    if (!res.ok) {
      if (res.status === 403 || res.status === 503) {
        throw new ScrapeError(422, `Strona zablokowała scraping (HTTP ${res.status})`)
      }
      throw new ScrapeError(422, `Strona zwróciła HTTP ${res.status}`)
    }
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('html')) {
      throw new ScrapeError(422, 'Strona nie zwraca HTML')
    }
    const reader = res.body.getReader()
    let received = 0
    const chunks = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.length
      if (received > MAX_BYTES) {
        ctrl.abort()
        throw new ScrapeError(422, 'Strona przekroczyła limit 2MB')
      }
      chunks.push(value)
    }
    const buf = Buffer.concat(chunks.map(c => Buffer.from(c)))
    return buf.toString('utf8')
  } catch (err) {
    if (err instanceof ScrapeError) throw err
    if (err.name === 'AbortError' || err.code === 'UND_ERR_ABORTED') {
      throw new ScrapeError(504, 'Strona nie odpowiedziała w czasie')
    }
    throw new ScrapeError(502, `Nie udało się pobrać strony: ${err.message}`)
  } finally {
    clearTimeout(t)
  }
}

function textOf($, sel) {
  return $(sel).first().text().trim() || null
}

function extractFromHtml(html, baseUrl) {
  const $ = cheerio.load(html)

  const title = textOf($, 'title')
  const metaDesc = $('meta[name="description"]').attr('content')?.trim() || null
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() || null
  const ogDesc = $('meta[property="og:description"]').attr('content')?.trim() || null
  const ogSite = $('meta[property="og:site_name"]').attr('content')?.trim() || null

  const h1 = textOf($, 'h1')
  const h2s = $('h2').slice(0, 3).map((_, el) => $(el).text().trim()).get().filter(Boolean)

  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()

  const phoneMatch = bodyText.match(/(?:\+?48[\s-]?)?(?:\d{3}[\s-]?\d{3}[\s-]?\d{3}|\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2})/)
  const phone = phoneMatch ? phoneMatch[0].trim() : null

  const emailMatch = bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  const email = emailMatch ? emailMatch[0] : null

  const socials = {}
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    if (!socials.linkedin && /linkedin\.com\//i.test(href)) socials.linkedin = href
    if (!socials.facebook && /facebook\.com\//i.test(href)) socials.facebook = href
    if (!socials.instagram && /instagram\.com\//i.test(href)) socials.instagram = href
    if (!socials.x && /(twitter|x)\.com\//i.test(href)) socials.x = href
  })

  const signals = []
  if ($('form').length > 0) signals.push('formularz kontaktowy obecny')
  if (/zaloguj|logowanie|sign in|log in/i.test(bodyText)) signals.push('strefa logowania (B2B-friendly)')
  if (/cennik|pricing|cena od|zł\s*\/\s*(mies|miesiąc)/i.test(bodyText)) signals.push('cennik publiczny')
  if (/sklep|koszyk|dodaj do koszyka/i.test(bodyText)) signals.push('e-commerce')
  if (/b2b/i.test(bodyText)) signals.push('B2B w copy')

  return {
    url: baseUrl,
    name: ogSite || ogTitle || title,
    tagline: ogDesc || metaDesc,
    h1,
    h2s,
    phone,
    email,
    socials,
    signals
  }
}

async function fetchSubpage(origin, path) {
  try {
    const html = await fetchHtml(origin + path, { timeoutMs: 5_000 })
    const $ = cheerio.load(html)
    $('script, style, nav, header, footer').remove()
    const text = $('main, article, [role=main], body').first().text().replace(/\s+/g, ' ').trim()
    return { path, text: text.slice(0, 500) }
  } catch {
    return null
  }
}

export async function scrapeWebsite(rawUrl) {
  const u = validateUrl(rawUrl)
  const homeHtml = await fetchHtml(u.toString())
  const main = extractFromHtml(homeHtml, u.toString())

  const origin = `${u.protocol}//${u.host}`
  const subpages = (await Promise.all(SUBPAGE_PATHS.map(p => fetchSubpage(origin, p))))
    .filter(Boolean)
    .slice(0, 2)

  return { ...main, subpages }
}

export function buildBriefMarkdown(data, { now = new Date() } = {}) {
  const ts = now.toISOString().slice(0, 16).replace('T', ' ')
  const lines = []
  lines.push(`## Brief ${ts}`)
  lines.push('')
  if (data.name) lines.push(`**Firma:** ${data.name}`)
  lines.push(`**WWW:** ${data.url}`)
  if (data.tagline) lines.push(`**Tagline:** ${data.tagline}`)
  const contactBits = [data.phone, data.email].filter(Boolean)
  if (contactBits.length) lines.push(`**Kontakt:** ${contactBits.join(' · ')}`)
  const socialBits = Object.entries(data.socials).map(([k, v]) => `${k}: ${v}`)
  if (socialBits.length) lines.push(`**Social:** ${socialBits.join(' · ')}`)
  if (data.h1) lines.push(`**H1:** ${data.h1}`)
  if (data.h2s?.length) lines.push(`**H2:** ${data.h2s.join(' | ')}`)

  if (data.subpages?.length) {
    lines.push('')
    lines.push('### Podstrony')
    for (const sp of data.subpages) {
      lines.push(`**${sp.path}:** ${sp.text}`)
    }
  }

  if (data.signals?.length) {
    lines.push('')
    lines.push('### Sygnały')
    for (const s of data.signals) lines.push(`- ${s}`)
  }

  lines.push('')
  lines.push('### Prompt do AI (skopiuj)')
  lines.push('```text')
  lines.push('Jesteś analitykiem sprzedaży B2B. Na podstawie poniższych danych firmowych przygotuj 3-akapitowy brief po polsku:')
  lines.push('(1) profil firmy i branża, (2) prawdopodobne potrzeby IT/CRM/automatyzacji, (3) 2 hooki na pierwszy kontakt.')
  lines.push('')
  lines.push('DANE:')
  lines.push(JSON.stringify(data, null, 2))
  lines.push('```')

  return lines.join('\n')
}
