const styles = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  shipped: 'bg-blue-100 text-blue-800',
  delivered: 'bg-gray-200 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
}

const OrderStatus = ({ status }) => (
  <span className={`inline-block px-2 py-1 text-xs font-semibold uppercase tracking-wider ${styles[status] || styles.pending}`}>
    {status}
  </span>
)

export default OrderStatus
