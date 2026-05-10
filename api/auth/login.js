import { signSession, buildSessionCookie, timingSafeEqualString } from '../_lib/auth.js'

// In-memory rate limit. Per-Vercel-instance only (stateless cold starts reset),
// but in practice consecutive attempts hit the same warm instance — sufficient
// to slow down brute force on a single IP. For multi-region distributed attacks
// this would need a shared store (Upstash Redis etc.), out of scope for now.
const ATTEMPTS = new Map() // ip -> { attempts: number[], lockedUntil: number }
const WINDOW_MS = 60_000
const MAX_FAILS_PER_WINDOW = 5
const LOCKOUT_MS = 5 * 60_000

function getIp(req) {
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim()
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown'
}

function checkRateLimit(ip) {
  const now = Date.now()
  const entry = ATTEMPTS.get(ip) || { attempts: [], lockedUntil: 0 }
  if (entry.lockedUntil > now) {
    return { ok: false, entry, retryAfter: Math.ceil((entry.lockedUntil - now) / 1000) }
  }
  entry.attempts = entry.attempts.filter((t) => now - t < WINDOW_MS)
  if (entry.attempts.length >= MAX_FAILS_PER_WINDOW) {
    entry.lockedUntil = now + LOCKOUT_MS
    ATTEMPTS.set(ip, entry)
    return { ok: false, entry, retryAfter: Math.ceil(LOCKOUT_MS / 1000) }
  }
  return { ok: true, entry }
}

function recordFail(ip, entry) {
  entry.attempts.push(Date.now())
  ATTEMPTS.set(ip, entry)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = getIp(req)
  const rate = checkRateLimit(ip)
  if (!rate.ok) {
    res.setHeader('Retry-After', String(rate.retryAfter))
    return res.status(429).json({
      error: `Za dużo prób. Spróbuj ponownie za ${Math.ceil(rate.retryAfter / 60)} min.`
    })
  }

  const expected = process.env.APP_PASSWORD
  if (!expected) {
    return res.status(500).json({ error: 'APP_PASSWORD not configured' })
  }

  const password = (req.body && req.body.password) || ''
  if (!timingSafeEqualString(password, expected)) {
    recordFail(ip, rate.entry)
    await new Promise((r) => setTimeout(r, 400))
    return res.status(401).json({ error: 'Niepoprawne hasło' })
  }

  ATTEMPTS.delete(ip) // success → reset counter

  const token = await signSession()
  res.setHeader('Set-Cookie', buildSessionCookie(token))
  return res.status(200).json({ ok: true })
}
