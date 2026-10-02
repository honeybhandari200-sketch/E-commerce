// Server-only helpers for JWT authentication. Do not import from client components.
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { serialize, parse } from 'cookie'
import { query } from './db'

const TOKEN_COOKIE = 'token'
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Add it to .env.local (see .env.example).')
  }
  return secret
}

async function createUser({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, 10)
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING
     RETURNING id, name, email`,
    [name.trim(), email.trim().toLowerCase(), passwordHash]
  )
  if (!rows.length) return { error: 'An account with this email already exists.' }
  return { user: rows[0] }
}

async function verifyCredentials(email, password) {
  const { rows } = await query(
    'SELECT id, name, email, password_hash FROM users WHERE email = $1',
    [email.trim().toLowerCase()]
  )
  const user = rows[0]
  if (!user) return null
  const valid = await bcrypt.compare(password, user.password_hash)
  return valid ? { id: user.id, name: user.name, email: user.email } : null
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, name: user.name, email: user.email },
    getSecret(),
    { expiresIn: TOKEN_TTL_SECONDS }
  )
}

function setTokenCookie(res, token) {
  res.setHeader('Set-Cookie', serialize(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS
  }))
}

function clearTokenCookie(res) {
  res.setHeader('Set-Cookie', serialize(TOKEN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  }))
}

/* Admins are the accounts listed in ADMIN_EMAILS (comma separated).
   Checked on every request, so edits to .env.local apply after a restart. */
function isAdminEmail(email) {
  const admins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return admins.includes((email || '').toLowerCase())
}

/* Returns { id, name, email, isAdmin } for a valid token cookie, otherwise null. */
function getUserFromRequest(req) {
  const token = parse(req.headers.cookie || '')[TOKEN_COOKIE]
  if (!token) return null
  try {
    const payload = jwt.verify(token, getSecret())
    return { id: payload.sub, name: payload.name, email: payload.email, isAdmin: isAdminEmail(payload.email) }
  } catch (err) {
    return null
  }
}

/* For admin API routes: returns the user, or sends 401/403 and returns null. */
function requireAdmin(req, res) {
  const user = getUserFromRequest(req)
  if (!user) {
    res.status(401).json({ error: 'Please sign in.' })
    return null
  }
  if (!user.isAdmin) {
    res.status(403).json({ error: 'Admins only.' })
    return null
  }
  return user
}

export {
  createUser,
  verifyCredentials,
  signToken,
  setTokenCookie,
  clearTokenCookie,
  getUserFromRequest,
  requireAdmin
}
