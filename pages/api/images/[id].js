import { query } from '../../../lib/db'
import { isUuid } from '../../../utils/helpers'

/* Serves product photos uploaded from the admin panel. */
export default async function image(req, res) {
  const { id } = req.query
  if (!isUuid(id)) return res.status(404).end()
  const { rows } = await query('SELECT content_type, data FROM images WHERE id = $1', [id])
  if (!rows.length) return res.status(404).end()

  // An image's id never points at different bytes, so browsers can cache it forever.
  res.setHeader('Content-Type', rows[0].content_type)
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  return res.status(200).send(rows[0].data)
}
