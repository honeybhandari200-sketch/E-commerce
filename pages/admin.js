import { useState } from 'react'
import Head from 'next/head'
import OrdersAdmin from '../components/admin/OrdersAdmin'
import ProductsAdmin from '../components/admin/ProductsAdmin'
import { siteName } from '../ecommerce.config'
import { getUserFromRequest } from '../lib/auth'
import { allOrders, orderStats } from '../lib/orders'
import { listProducts, listCategories } from '../lib/products'
import { withNav } from '../lib/nav'
import DENOMINATION from '../utils/currencyProvider'

const money = cents => DENOMINATION + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const Stat = ({ label, value }) => (
  <div className="bg-light p-5">
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">{label}</p>
    <p className="text-2xl">{value}</p>
  </div>
)

export default function Admin({ authorized, email, orders, stats, products, categories }) {
  const [tab, setTab] = useState('orders')

  if (!authorized) {
    return (
      <div className="py-16 flex flex-col items-center text-center">
        <h1 className="text-4xl font-light mb-3">Admins only</h1>
        <p className="text-gray-600 text-sm max-w-112">
          You are signed in as <strong>{email}</strong>, which is not an admin account.
          Add this email to <code>ADMIN_EMAILS</code> in <code>.env.local</code> and restart the server to grant access.
        </p>
      </div>
    )
  }

  const tabClass = active => `mr-6 pb-2 text-sm font-semibold focus:outline-none ${
    active ? 'border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-900'
  }`

  return (
    <>
      <Head>
        <title>{siteName} - Admin</title>
      </Head>
      <div className="pt-4 pb-6">
        <h1 className="text-5xl font-light">Admin Panel</h1>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        <Stat label="Revenue" value={money(stats.revenue)} />
        <Stat label="Paid orders" value={stats.paidOrders} />
        <Stat label="Waiting to ship" value={stats.toShip} />
        <Stat label="Low stock (≤ 2)" value={stats.lowStock} />
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button className={tabClass(tab === 'orders')} onClick={() => setTab('orders')}>Orders</button>
        <button className={tabClass(tab === 'products')} onClick={() => setTab('products')}>Products</button>
      </div>

      {tab === 'orders'
        ? <OrdersAdmin initialOrders={orders} />
        : <ProductsAdmin initialProducts={products} categories={categories} />}
    </>
  )
}

export async function getServerSideProps({ req }) {
  const user = getUserFromRequest(req)
  if (!user) {
    return { redirect: { destination: '/login?next=/admin', permanent: false } }
  }
  if (!user.isAdmin) {
    return withNav({ props: { authorized: false, email: user.email } })
  }
  const [orders, stats, products, categories] = await Promise.all([
    allOrders(),
    orderStats(),
    listProducts({ includeInactive: true, sort: 'newest' }),
    listCategories()
  ])
  return withNav({
    props: {
      authorized: true,
      email: user.email,
      orders,
      stats,
      products,
      categories: categories.map(c => ({ slug: c.slug, name: c.name }))
    }
  })
}
