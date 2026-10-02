import { requireAdmin } from '../../../../lib/auth'
import { OrderError, updateOrderStatus } from '../../../../lib/orders'
import { settleCancelledPayment } from '../../../../lib/payments'

/* Ship, deliver or cancel an order. Cancelling refunds the customer and restocks. */
export default async function order(req, res) {
  if (!requireAdmin(req, res)) return
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const updated = await updateOrderStatus(req.query.id, (req.body || {}).status, {
      settlePayment: settleCancelledPayment
    })
    return res.status(200).json({ order: updated })
  } catch (err) {
    if (err instanceof OrderError) return res.status(err.status).json({ error: err.message })
    if (err.type && err.type.startsWith('Stripe')) {
      console.error('Stripe error:', err.message)
      return res.status(502).json({ error: `Stripe: ${err.message}` })
    }
    throw err
  }
}
