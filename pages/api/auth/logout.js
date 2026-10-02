import { clearTokenCookie } from '../../../lib/auth'

export default function logout(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  clearTokenCookie(res)
  return res.status(200).json({ ok: true })
}
