import { getProductsByIds } from '../../../lib/products'

/* Current price and stock for the sofas in a shopper's cart. */
export default async function lookup(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const ids = Array.isArray((req.body || {}).ids) ? req.body.ids.slice(0, 100) : []
  const products = await getProductsByIds(ids)
  return res.status(200).json({ products: products.filter(p => p.isActive) })
}
