import { getUserFromRequest } from '../../../lib/auth'
import { getStripe } from '../../../lib/payments'
import { getOrder, markPaid, discardPendingOrder } from '../../../lib/orders'

/* Called after the browser completes 3D Secure. Stripe is the source of truth:
   the order is only marked paid if its payment really succeeded. */
export default async function confirm(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Please sign in.' })

  const order = await getOrder((req.body || {}).orderId)
  if (!order || order.userId !== user.id) return res.status(404).json({ error: 'Order not found.' })
  if (order.status !== 'pending') return res.status(200).json({ order })
  if (!order.paymentIntentId) return res.status(402).json({ error: 'Payment was not completed.' })

  const paymentIntent = await getStripe().paymentIntents.retrieve(order.paymentIntentId)
  if (paymentIntent.status === 'succeeded') {
    return res.status(200).json({ order: await markPaid(order.id) })
  }
  // Verification failed or was abandoned: release the sofas for other shoppers.
  if (['requires_payment_method', 'canceled'].includes(paymentIntent.status)) {
    await discardPendingOrder(order.id)
  }
  return res.status(402).json({ error: 'Payment was not completed.' })
}
