// Server-only Stripe helpers.
import Stripe from 'stripe'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Payments are not configured. Set STRIPE_SECRET_KEY in .env.local.')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

/* For a cancelled order: refund the money if it was taken, otherwise cancel the
   payment so the customer can no longer complete it. Returns true if refunded. */
async function settleCancelledPayment(order) {
  if (!order.paymentIntentId) return false
  const stripe = getStripe()
  const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId)
  if (paymentIntent.status === 'succeeded') {
    await stripe.refunds.create({ payment_intent: paymentIntent.id }, { idempotencyKey: `refund-${order.id}` })
    return true
  }
  if (paymentIntent.status !== 'canceled') {
    await stripe.paymentIntents.cancel(paymentIntent.id)
  }
  return false
}

export { getStripe, settleCancelledPayment }
