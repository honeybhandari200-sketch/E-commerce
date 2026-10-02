import { verifyCredentials, signToken, setTokenCookie } from '../../../lib/auth'

export default async function login(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email = '', password = '' } = req.body || {}
  const user = await verifyCredentials(email, password)
  if (!user) return res.status(401).json({ error: 'Incorrect email or password.' })

  setTokenCookie(res, signToken(user))
  return res.status(200).json({ user })
}
