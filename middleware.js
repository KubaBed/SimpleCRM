import { jwtVerify } from 'jose'

export const config = {
  // Skip /api/auth/*, /api/cron/*, /assets/*, oraz każdą ścieżkę z rozszerzeniem (statics)
  matcher: ['/((?!api/auth|api/cron|assets|.*\\..*).*)']
}

const PUBLIC_PATHS = new Set(['/login'])

export default async function middleware(request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  if (PUBLIC_PATHS.has(pathname)) return

  const cookie = request.headers.get('cookie') || ''
  const match = cookie.match(/(?:^|;\s*)session=([^;]+)/)
  const token = match ? decodeURIComponent(match[1]) : null

  let valid = false
  if (token && process.env.SESSION_SECRET) {
    try {
      const secret = new TextEncoder().encode(process.env.SESSION_SECRET)
      await jwtVerify(token, secret)
      valid = true
    } catch {
      // token invalid/expired → traktuj jak brak
    }
  }

  if (valid) return

  // API request bez cookie → 401 (nie redirect — fetch nie chce HTML)
  if (pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' }
    })
  }

  // Strona webowa → redirect na /login
  const loginUrl = new URL('/login', request.url)
  if (pathname !== '/') {
    loginUrl.searchParams.set('next', pathname + url.search)
  }
  return Response.redirect(loginUrl, 307)
}
