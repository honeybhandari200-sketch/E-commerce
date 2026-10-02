import Head from 'next/head'
import Link from 'next/link'
import { getUserFromRequest } from '../../lib/auth'
import { withNav } from '../../lib/nav'
import { siteName } from '../../ecommerce.config'
import { ordersForUser } from '../../lib/orders'
import { shortOrderId } from '../../components/Receipt'
import OrderStatus from '../../components/OrderStatus'
import DENOMINATION from '../../utils/currencyProvider'

const money = cents => DENOMINATION + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Orders({ orders }) {
  return (
    <>
      <Head>
        <title>{siteName} - Order history</title>
      </Head>
      <div className="pt-4 pb-8">
        <h1 className="text-5xl font-light">Order history</h1>
      </div>

      {orders.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center bg-light">
          <h3 className="text-2xl mb-2">No orders yet</h3>
          <p className="text-gray-600 text-sm mb-8">When you buy something, it will show up here.</p>
          <Link href="/categories">
            <a className="px-8 py-3 border-2 border-gray-900 text-sm font-semibold hover:bg-gray-900 hover:text-white transition-colors">
              Start shopping
            </a>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
          {orders.map(order => {
            const itemCount = order.items.reduce((n, item) => n + item.quantity, 0)
            return (
              <Link href={`/orders/${order.id}`} key={order.id}>
                <a className="flex flex-wrap items-center gap-4 py-5 hover:bg-light transition-colors px-2">
                  <div className="flex-1 min-w-48">
                    <p className="font-semibold">Order #{shortOrderId(order.id)}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{order.items.map(i => i.name).join(', ')}</p>
                  </div>
                  <OrderStatus status={order.status} />
                  <p className="w-28 text-right font-semibold">{money(order.amount)}</p>
                  <span className="text-sm text-gray-600 underline">View receipt</span>
                </a>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}

export async function getServerSideProps({ req }) {
  const user = getUserFromRequest(req)
  if (!user) {
    return { redirect: { destination: '/login?next=/orders', permanent: false } }
  }
  return withNav({ props: { orders: await ordersForUser(user.id) } })
}
