// Server-only product reviews. One review per customer per product; posting
// again replaces the earlier review.
import { query } from './db'

const PURCHASED = `EXISTS (
  SELECT 1 FROM orders o JOIN order_items i ON i.order_id = o.id
  WHERE o.user_id = r.user_id AND i.product_id = r.product_id AND o.status IN ('paid', 'shipped', 'delivered'))`

function toReview(row) {
  return {
    id: row.id,
    userId: row.user_id,
    author: row.author,
    rating: row.rating,
    title: row.title,
    body: row.body,
    verified: row.verified,
    createdAt: row.created_at.toISOString()
  }
}

async function reviewsForProduct(productId) {
  const { rows } = await query(
    `SELECT r.*, split_part(u.name, ' ', 1) AS author, ${PURCHASED} AS verified
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.product_id = $1
     ORDER BY r.created_at DESC`,
    [productId]
  )
  return rows.map(toReview)
}

/* Checks review input. Returns { values } or { error }. */
function validateReview(body = {}) {
  const rating = Number(body.rating)
  const title = String(body.title || '').trim().slice(0, 120)
  const text = String(body.body || '').trim().slice(0, 2000)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: 'Choose a rating from 1 to 5 stars.' }
  if (!text) return { error: 'Tell other shoppers what you think.' }
  return { values: { rating, title, body: text } }
}

async function saveReview({ productId, userId, rating, title, body }) {
  await query(
    `INSERT INTO reviews (product_id, user_id, rating, title, body) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (product_id, user_id)
     DO UPDATE SET rating = $3, title = $4, body = $5, created_at = now()`,
    [productId, userId, rating, title, body]
  )
}

export { reviewsForProduct, validateReview, saveReview }
