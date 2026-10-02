import { requireAdmin } from '../../../../lib/auth'
import { listProducts, validateProductInput, createProduct, getProductsByIds } from '../../../../lib/products'

export default async function products(req, res) {
  if (!requireAdmin(req, res)) return

  if (req.method === 'GET') {
    return res.status(200).json({ products: await listProducts({ includeInactive: true, sort: 'newest' }) })
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { values, error } = validateProductInput(req.body)
  if (error) return res.status(400).json({ error })
  const id = await createProduct(values)
  const [product] = await getProductsByIds([id])
  return res.status(201).json({ product })
}
