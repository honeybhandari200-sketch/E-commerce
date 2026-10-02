import { requireAdmin } from '../../../lib/auth'
import { query } from '../../../lib/db'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 4 * 1024 * 1024

export const config = { api: { bodyParser: { sizeLimit: '6mb' } } }

/* Saves a product photo sent as a data URL and returns the URL to show it. */
export default async function images(req, res) {
  if (!requireAdmin(req, res)) return
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const match = /^data:([\w/+.-]+);base64,(.+)$/.exec((req.body || {}).dataUrl || '')
  if (!match || !ALLOWED_TYPES.includes(match[1])) {
    return res.status(400).json({ error: 'Upload a PNG, JPEG or WebP image.' })
  }
  const data = Buffer.from(match[2], 'base64')
  if (data.length > MAX_BYTES) return res.status(400).json({ error: 'Images must be 4 MB or smaller.' })

  const { rows } = await query('INSERT INTO images (content_type, data) VALUES ($1, $2) RETURNING id', [match[1], data])
  return res.status(201).json({ url: `/api/images/${rows[0].id}` })
}
