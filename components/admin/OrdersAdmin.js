import { useState } from 'react'
import Link from 'next/link'
import OrderStatus from '../OrderStatus'
import { shortOrderId } from '../Receipt'
import DENOMINATION from '../../utils/currencyProvider'
import { ORDER_STATUSES, NEXT_STATUSES } from '../../utils/catalog'

const money = cents => DENOMINATION + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const ACTION_LABELS = {
  shipped: 'Mark shipped',
  delivered: 'Mark delivered',
  cancelled: 'Cancel order'
}

function OrderActions({ order, onUpdated }) {
  const [busy, setBusy] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [error, setError] = useState(null)
  const actions = NEXT_STATUSES[order.status] || []
  if (!actions.length) return order.refunded ? <span className="text-xs text-gray-500">Refunded</span> : null

  async function setStatus(status) {
    setBusy(true)
    setError(null)
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    setConfirmCancel(false)
    if (!res.ok) return setError(data.error || 'Could not update the order.')
    onUpdated(data.order)
  }

  const button = 'block w-full mb-1 px-3 py-1 text-xs font-semibold border focus:outline-none disabled:opacity-50 whitespace-nowrap'
  return (
    <div className="w-36">
      {actions.map(status => {
        if (status !== 'cancelled') {
          return (
            <button key={status} disabled={busy} onClick={() => setStatus(status)} className={`${button} border-gray-900 hover:bg-gray-900 hover:text-white`}>
              {ACTION_LABELS[status]}
            </button>
          )
        }
        return confirmCancel ? (
          <div key={status}>
            <button disabled={busy} onClick={() => setStatus('cancelled')} className={`${button} bg-red-600 border-red-600 text-white`}>
              {order.status === 'paid' ? 'Confirm refund' : 'Confirm cancel'}
            </button>
            <button disabled={busy} onClick={() => setConfirmCancel(false)} className="text-xs underline text-gray-600">Keep order</button>
          </div>
        ) : (
          <button key={status} disabled={busy} onClick={() => setConfirmCancel(true)} className={`${button} border-red-600 text-red-600 hover:bg-red-50`}>
            {order.status === 'paid' ? 'Cancel & refund' : ACTION_LABELS.cancelled}
          </button>
        )
      })}
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default function OrdersAdmin({ initialOrders }) {
  const [orders, setOrders] = useState(initialOrders)
  const [filter, setFilter] = useState('all')
  const shown = filter === 'all' ? orders : orders.filter(o => o.status === filter)
  const replace = updated => setOrders(orders.map(o => (o.id === updated.id ? updated : o)))

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', ...ORDER_STATUSES].map(status => {
          const count = status === 'all' ? orders.length : orders.filter(o => o.status === status).length
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider border focus:outline-none ${
                filter === status ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-900'
              }`}
            >
              {status} ({count})
            </button>
          )
        })}
      </div>

      {shown.length === 0 ? (
        <p className="py-10 text-gray-600">No orders here.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-300 text-xs uppercase tracking-wider text-gray-600">
                <th className="py-3 pr-4">Order</th>
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Customer</th>
                <th className="py-3 pr-4">Deliver to</th>
                <th className="py-3 pr-4">Items</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4 text-right">Total</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {shown.map(order => (
                <tr key={order.id} className="align-top">
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <Link href={`/orders/${order.id}`}>
                      <a className="font-semibold underline">#{shortOrderId(order.id)}</a>
                    </Link>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="py-3 pr-4">
                    <p>{order.name}</p>
                    <p className="text-gray-600">{order.email}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <p>{order.address}</p>
                    <p className="text-gray-600">{order.phone}</p>
                  </td>
                  <td className="py-3 pr-4">
                    {order.items.map((item, i) => (
                      <p key={i}>{item.quantity} × {item.name}</p>
                    ))}
                  </td>
                  <td className="py-3 pr-4"><OrderStatus status={order.status} /></td>
                  <td className="py-3 pr-4 text-right font-semibold whitespace-nowrap">{money(order.amount)}</td>
                  <td className="py-3"><OrderActions order={order} onUpdated={replace} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
