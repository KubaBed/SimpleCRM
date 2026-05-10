import { signSession, buildSessionCookie, timingSafeEqualString } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const expected = process.env.APP_PASSWORD
  if (!expected) {
    return res.status(500).json({ error: 'APP_PASSWORD not configured' })
  }

  const password = (req.body && req.body.password) || ''
  if (!timingSafeEqualString(password, expected)) {
    // Mała pauza żeby utrudnić bruteforce
    await new Promise(r => setTimeout(r, 400))
    return res.status(401).json({ error: 'Niepoprawne hasło' })
  }

  const token = await signSession()
  res.setHeader('Set-Cookie', buildSessionCookie(token))
  return res.status(200).json({ ok: true })
}
