import Head from 'next/head'
import Receipt, { shortOrderId } from '../../components/Receipt'
import { getUserFromRequest } from '../../lib/auth'
import { withNav } from '../../lib/nav'
import { siteName } from '../../ecommerce.config'
import { getOrder } from '../../lib/orders'

export default function OrderReceipt({ order }) {
  return (
    <>
      <Head>
        <title>{`${siteName} - Order #${shortOrderId(order.id)}`}</title>
      </Head>
      <Receipt order={order} />
    </>
  )
}

/* Customers can only see their own orders; admins can see any order. */
export async function getServerSideProps({ req, params }) {
  const user = getUserFromRequest(req)
  if (!user) {
    return { redirect: { destination: `/login?next=/orders/${encodeURIComponent(params.id)}`, permanent: false } }
  }
  const order = await getOrder(params.id)
  if (!order || (order.userId !== user.id && !user.isAdmin)) {
    return { notFound: true }
  }
  return withNav({ props: { order } })
}
