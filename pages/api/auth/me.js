import { getUserFromRequest } from '../../../lib/auth'

export default function me(req, res) {
  const user = getUserFromRequest(req)
  if (!user) return res.status(401).json({ user: null })
  return res.status(200).json({ user })
}
