import Link from 'next/link'
import DENOMINATION from '../utils/currencyProvider'
import { siteName } from '../ecommerce.config'

const money = cents => DENOMINATION + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/* Decorative barcode derived from the order id. */
function Barcode({ value }) {
  const bars = value.replace(/-/g, '').split('').map((char, i) => {
    const n = parseInt(char, 16)
    return <span key={i} style={{ width: (n % 3) + 1, marginRight: (n % 2) + 1 }} />
  })
  return <div className="receipt-barcode" aria-hidden="true">{bars}</div>
}

const Row = ({ label, value, bold }) => (
  <div className={`flex justify-between ${bold ? 'font-bold text-base' : ''}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
)

const shortOrderId = id => id.split('-')[0].toUpperCase()

/* Order receipt. With `animate` it "prints" out of a slot (used right after
   checkout); without it, it renders instantly (order history). */
export { shortOrderId }

export default function Receipt({ order, animate = false }) {
  const date = new Date(order.createdAt)
  const shortId = shortOrderId(order.id)
  const { card } = order
  const stamp = order.status === 'cancelled' ? 'VOID' : order.status === 'pending' ? null : 'PAID'

  return (
    <div className={`flex flex-col items-center py-8 sm:py-12 ${animate ? '' : 'receipt-static'}`}>
      <h1 className="text-4xl font-light mb-2 text-center receipt-fade" style={{ animationDelay: '3.2s' }}>
        {animate ? 'Thank you for your order!' : `Order #${shortId}`}
      </h1>
      <p className="text-gray-600 text-sm mb-10 text-center receipt-fade" style={{ animationDelay: '3.4s' }}>
        {animate ? 'Your payment was successful. Here is your receipt.' : `Placed on ${date.toLocaleDateString()}`}
      </p>

      <div className="receipt-printer" aria-hidden="true">
        <div className="receipt-printer-light" />
      </div>

      <div className="receipt-feed">
        <div className="receipt-paper" role="region" aria-label="Order receipt">
          <div className="text-center mb-4">
            <img src="/logo.png" alt={siteName} width="72" height="22" className="mx-auto mb-2" />
            <p className="receipt-muted">{siteName}</p>
            <p className="receipt-muted">{date.toLocaleDateString()} · {date.toLocaleTimeString()}</p>
          </div>

          <p className="receipt-divider" />
          <Row label="ORDER" value={`#${shortId}`} />
          {!animate && <Row label="STATUS" value={`${order.status.toUpperCase()}${order.refunded ? ' · REFUNDED' : ''}`} />}
          <p className="receipt-divider" />

          <div className="space-y-2">
            {order.items.map(item => (
              <div key={item.name}>
                <div className="flex justify-between">
                  <span className="pr-4">{item.name}</span>
                  <span>{money(item.unitAmount * item.quantity)}</span>
                </div>
                {item.quantity > 1 && (
                  <p className="receipt-muted">{item.quantity} × {money(item.unitAmount)}</p>
                )}
              </div>
            ))}
          </div>

          <p className="receipt-divider" />
          <Row label="Subtotal" value={money(order.amount)} />
          <Row label="Shipping" value="FREE" />
          <p className="receipt-divider" />
          <Row label="TOTAL" value={money(order.amount)} bold />
          <p className="receipt-divider" />

          {card && (
            <Row label="Paid with" value={`${card.brand.toUpperCase()} •••• ${card.last4}`} />
          )}

          <div className="mt-3">
            <p className="receipt-muted">DELIVER TO</p>
            <p>{order.name}</p>
            <p>{order.address}</p>
            <p>{order.phone}</p>
          </div>

          <Barcode value={order.id} />
          <p className="text-center receipt-muted">THANK YOU FOR SHOPPING WITH US</p>

          {stamp && <div className="receipt-stamp" aria-label={stamp}>{stamp}</div>}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-10 receipt-fade receipt-actions" style={{ animationDelay: '3.6s' }}>
        <button
          onClick={() => window.print()}
          className="px-8 py-3 bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors focus:outline-none"
        >
          Print receipt
        </button>
        <Link href={animate ? '/' : '/orders'}>
          <a className="px-8 py-3 border-2 border-gray-900 text-sm font-semibold hover:bg-gray-900 hover:text-white transition-colors">
            {animate ? 'Continue shopping' : 'Back to orders'}
          </a>
        </Link>
      </div>
    </div>
  )
}
