import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

function getSecret() {
  const raw = process.env.SESSION_SECRET
  if (!raw) throw new Error('Missing SESSION_SECRET env var')
  return new TextEncoder().encode(raw)
}

export async function signSession() {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret())
}

export async function verifySession(token) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}

export function readSessionCookie(cookieHeader) {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function buildSessionCookie(token, { clear = false } = {}) {
  const isProd = process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview'
  const parts = [
    `${COOKIE_NAME}=${clear ? '' : token}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${clear ? 0 : MAX_AGE_SECONDS}`,
  ]
  if (isProd) parts.push('Secure')
  return parts.join('; ')
}

export function timingSafeEqualString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export const SESSION_COOKIE_NAME = COOKIE_NAME
