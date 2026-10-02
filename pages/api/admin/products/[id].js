import { requireAdmin } from '../../../../lib/auth'
import { validateProductInput, updateProduct, deleteProduct, getProductsByIds } from '../../../../lib/products'
import { isUuid } from '../../../../utils/helpers'

export default async function product(req, res) {
  if (!requireAdmin(req, res)) return
  const { id } = req.query
  if (!isUuid(id)) return res.status(404).json({ error: 'Product not found.' })

  if (req.method === 'PUT') {
    const { values, error } = validateProductInput(req.body)
    if (error) return res.status(400).json({ error })
    if (!(await updateProduct(id, values))) return res.status(404).json({ error: 'Product not found.' })
    const [updated] = await getProductsByIds([id])
    return res.status(200).json({ product: updated })
  }
  if (req.method === 'DELETE') {
    if (!(await deleteProduct(id))) return res.status(404).json({ error: 'Product not found.' })
    return res.status(200).json({ ok: true })
  }
  res.setHeader('Allow', 'PUT, DELETE')
  return res.status(405).json({ error: 'Method not allowed' })
}
