import { readSessionCookie, verifySession } from '../_lib/auth.js'

export default async function handler(req, res) {
  const token = readSessionCookie(req.headers.cookie)
  const payload = await verifySession(token)
  if (!payload) return res.status(401).json({ ok: false })
  return res.status(200).json({ ok: true })
}
