// Server-only order store backed by Postgres.
// Stock is taken when an order is created (status "pending") and given back if
// the payment fails or the order is cancelled, so two customers can never buy
// the last sofa at the same time.
import { query, transaction } from './db'
import { isUuid } from '../utils/helpers'
import { NEXT_STATUSES } from '../utils/catalog'

class OrderError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

const ORDER_SELECT = `
  SELECT o.*,
         COALESCE(json_agg(json_build_object(
           'productId', i.product_id, 'name', i.name, 'quantity', i.quantity, 'unitAmount', i.unit_amount
         ) ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
  FROM orders o
  LEFT JOIN order_items i ON i.order_id = o.id`

function toOrder(row) {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    name: row.name,
    address: row.address,
    phone: row.phone,
    items: row.items,
    amount: row.amount_cents,
    status: row.status,
    card: row.card_brand ? { brand: row.card_brand, last4: row.card_last4 } : null,
    paymentIntentId: row.payment_intent_id,
    refunded: row.refunded,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  }
}

/* Combines duplicate cart lines and checks quantities. Returns null if invalid. */
function normalizeItems(items) {
  const quantities = {}
  for (const item of items) {
    const qty = Number(item && item.quantity)
    if (!item || !isUuid(item.id) || !Number.isInteger(qty) || qty < 1) return null
    quantities[item.id] = (quantities[item.id] || 0) + qty
  }
  return Object.entries(quantities).map(([id, quantity]) => ({ id, quantity }))
}

/* Prices the cart from the database, takes the stock and saves a pending order.
   Throws OrderError with a message that is safe to show the customer. */
async function createPendingOrder({ userId, email, name, address, phone, items }) {
  const lines = normalizeItems(items)
  if (!lines || !lines.length) throw new OrderError('Your cart is empty or invalid.')

  return transaction(async client => {
    // FOR UPDATE locks these rows until the order is saved.
    const { rows: products } = await client.query(
      'SELECT id, name, price_cents, stock, is_active FROM products WHERE id = ANY($1) FOR UPDATE',
      [lines.map(l => l.id)]
    )
    const orderItems = lines.map(line => {
      const product = products.find(p => p.id === line.id)
      if (!product || !product.is_active) {
        throw new OrderError('Your cart contains a sofa that is no longer available. Please review your cart.', 409)
      }
      if (product.stock < line.quantity) {
        const left = product.stock ? `Only ${product.stock} left` : 'It is out of stock'
        throw new OrderError(`Sorry, not enough "${product.name}" in stock. ${left}.`, 409)
      }
      return { productId: product.id, name: product.name, unitAmount: product.price_cents, quantity: line.quantity }
    })
    const amount = orderItems.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0)

    for (const item of orderItems) {
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.productId])
    }
    const { rows } = await client.query(
      `INSERT INTO orders (user_id, email, name, address, phone, amount_cents)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [userId, email, name, address, phone, amount]
    )
    const orderId = rows[0].id
    for (const item of orderItems) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, name, unit_amount, quantity) VALUES ($1, $2, $3, $4, $5)',
        [orderId, item.productId, item.name, item.unitAmount, item.quantity]
      )
    }
    return { id: orderId, amount, items: orderItems }
  })
}

async function restock(client, orderId) {
  await client.query(
    `UPDATE products p SET stock = p.stock + i.quantity
     FROM order_items i WHERE i.order_id = $1 AND i.product_id = p.id`,
    [orderId]
  )
}

/* Payment never went through: give the stock back and forget the order. */
async function discardPendingOrder(orderId) {
  await transaction(async client => {
    const { rows } = await client.query("SELECT 1 FROM orders WHERE id = $1 AND status = 'pending' FOR UPDATE", [orderId])
    if (!rows.length) return
    await restock(client, orderId)
    await client.query('DELETE FROM orders WHERE id = $1', [orderId])
  })
}

async function recordPayment(orderId, { paymentIntentId, card, paid }) {
  const { rows } = await query(
    `UPDATE orders SET payment_intent_id = $2, card_brand = $3, card_last4 = $4,
            status = CASE WHEN $5 AND status = 'pending' THEN 'paid' ELSE status END, updated_at = now()
     WHERE id = $1 RETURNING id`,
    [orderId, paymentIntentId, card ? card.brand : null, card ? card.last4 : null, paid]
  )
  return rows.length ? getOrder(orderId) : null
}

async function markPaid(orderId) {
  await query("UPDATE orders SET status = 'paid', updated_at = now() WHERE id = $1 AND status = 'pending'", [orderId])
  return getOrder(orderId)
}

async function getOrder(id) {
  if (!isUuid(id)) return null
  const { rows } = await query(`${ORDER_SELECT} WHERE o.id = $1 GROUP BY o.id`, [id])
  return rows[0] ? toOrder(rows[0]) : null
}

async function ordersForUser(userId) {
  const { rows } = await query(`${ORDER_SELECT} WHERE o.user_id = $1 GROUP BY o.id ORDER BY o.created_at DESC`, [userId])
  return rows.map(toOrder)
}

async function allOrders({ status } = {}) {
  const { rows } = await query(
    `${ORDER_SELECT} WHERE ($1::text IS NULL OR o.status = $1) GROUP BY o.id ORDER BY o.created_at DESC LIMIT 500`,
    [status || null]
  )
  return rows.map(toOrder)
}

async function orderStats() {
  const { rows } = await query(
    `SELECT count(*)::int AS orders,
            count(*) FILTER (WHERE status IN ('paid', 'shipped', 'delivered'))::int AS paid_orders,
            count(*) FILTER (WHERE status = 'paid')::int AS to_ship,
            COALESCE(sum(amount_cents) FILTER (WHERE status IN ('paid', 'shipped', 'delivered')), 0)::int AS revenue,
            (SELECT count(*)::int FROM products WHERE is_active AND stock <= 2) AS low_stock
     FROM orders`
  )
  const r = rows[0]
  return { orders: r.orders, paidOrders: r.paid_orders, toShip: r.to_ship, revenue: r.revenue, lowStock: r.low_stock }
}

/* Moves an order along paid → shipped → delivered, or cancels it.
   `settlePayment(order)` is called when cancelling, to refund or void the payment;
   it returns true if money was refunded. Cancelling puts the stock back. */
async function updateOrderStatus(orderId, status, { settlePayment } = {}) {
  if (!isUuid(orderId)) throw new OrderError('Order not found.', 404)
  await transaction(async client => {
    const { rows } = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [orderId])
    const order = rows[0]
    if (!order) throw new OrderError('Order not found.', 404)
    if (!(NEXT_STATUSES[order.status] || []).includes(status)) {
      throw new OrderError(`A ${order.status} order cannot be marked ${status}.`, 409)
    }

    let refunded = false
    if (status === 'cancelled') {
      if (settlePayment) refunded = await settlePayment(toOrder({ ...order, items: [] }))
      await restock(client, orderId)
    }
    await client.query(
      'UPDATE orders SET status = $2, refunded = refunded OR $3, updated_at = now() WHERE id = $1',
      [orderId, status, refunded]
    )
  })
  return getOrder(orderId)
}

export {
  OrderError,
  createPendingOrder,
  discardPendingOrder,
  recordPayment,
  markPaid,
  getOrder,
  ordersForUser,
  allOrders,
  orderStats,
  updateOrderStatus
}
