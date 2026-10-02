import { getUserFromRequest } from '../../lib/auth'
import { getStripe } from '../../lib/payments'
import { OrderError, createPendingOrder, discardPendingOrder, recordPayment } from '../../lib/orders'

/* Placing an order requires a valid login token. The server prices the cart
   from the database, so the browser can't change what gets charged. */
export default async function orders(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Please sign in to place an order.' })

  let stripe
  try {
    stripe = getStripe()
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }

  const { items, payment_method_id, name, address, phone, email } = req.body || {}
  if (!Array.isArray(items) || !items.length || !payment_method_id) {
    return res.status(400).json({ error: 'Missing order details.' })
  }
  if (typeof address !== 'string' || !address.trim()) {
    return res.status(400).json({ error: 'Please enter your delivery address.' })
  }
  if (typeof phone !== 'string' || phone.replace(/\D/g, '').length < 7) {
    return res.status(400).json({ error: 'Please enter a valid phone number.' })
  }

  const customer = {
    userId: user.id,
    email: (typeof email === 'string' && email.trim()) || user.email,
    name: ((typeof name === 'string' && name) || user.name).trim(),
    address: address.trim(),
    phone: phone.trim()
  }

  let order
  try {
    order = await createPendingOrder({ ...customer, items })
  } catch (err) {
    if (err instanceof OrderError) return res.status(err.status).json({ error: err.message })
    throw err
  }

  let paymentIntent
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: order.amount,
      currency: 'usd',
      payment_method: payment_method_id,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      receipt_email: customer.email,
      shipping: {
        name: customer.name,
        phone: customer.phone,
        address: { line1: customer.address }
      },
      metadata: { orderId: order.id, userId: user.id },
      expand: ['payment_method']
    }, { idempotencyKey: `order-${order.id}` })
  } catch (err) {
    await discardPendingOrder(order.id)
    // Card errors (declined, expired, ...) are safe to show to the customer.
    const message = err.type === 'StripeCardError' ? err.message : 'Payment failed. Please try again.'
    if (err.type !== 'StripeCardError') console.error('Stripe error:', err.message)
    return res.status(402).json({ error: message })
  }

  const card = paymentIntent.payment_method && paymentIntent.payment_method.card
  const payment = {
    paymentIntentId: paymentIntent.id,
    card: card ? { brand: card.brand, last4: card.last4 } : null
  }

  // Card needs extra verification (e.g. 3D Secure): the browser finishes it,
  // then calls /api/orders/confirm which marks the order paid.
  if (paymentIntent.status === 'requires_action') {
    const saved = await recordPayment(order.id, { ...payment, paid: false })
    return res.status(200).json({ order: saved, requiresAction: true, clientSecret: paymentIntent.client_secret })
  }
  if (paymentIntent.status !== 'succeeded') {
    await discardPendingOrder(order.id)
    return res.status(402).json({ error: 'Payment was not completed. Please try another card.' })
  }

  return res.status(201).json({ order: await recordPayment(order.id, { ...payment, paid: true }) })
}
