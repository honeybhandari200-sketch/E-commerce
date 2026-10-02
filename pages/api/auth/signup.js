import { createUser, signToken, setTokenCookie } from '../../../lib/auth'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default async function signup(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name = '', email = '', password = '' } = req.body || {}
  if (!name.trim()) return res.status(400).json({ error: 'Please enter your name.' })
  if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' })

  const { user, error } = await createUser({ name, email, password })
  if (error) return res.status(409).json({ error })

  setTokenCookie(res, signToken(user))
  return res.status(201).json({ user })
}
