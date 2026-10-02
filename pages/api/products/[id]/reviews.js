import { getUserFromRequest } from '../../../../lib/auth'
import { getProductsByIds } from '../../../../lib/products'
import { reviewsForProduct, validateReview, saveReview } from '../../../../lib/reviews'

export default async function reviews(req, res) {
  const [product] = await getProductsByIds([req.query.id])
  if (!product || !product.isActive) return res.status(404).json({ error: 'Product not found.' })

  if (req.method === 'GET') {
    return res.status(200).json({ reviews: await reviewsForProduct(product.id) })
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Please sign in to write a review.' })
  const { values, error } = validateReview(req.body)
  if (error) return res.status(400).json({ error })

  await saveReview({ productId: product.id, userId: user.id, ...values })
  return res.status(201).json({ reviews: await reviewsForProduct(product.id) })
}
