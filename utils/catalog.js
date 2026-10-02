// Catalogue constants shared by pages and the server.
const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' }
]

const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

/* Which status an admin may move an order to next. */
const NEXT_STATUSES = {
  pending: ['cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
}

export { SORT_OPTIONS, ORDER_STATUSES, NEXT_STATUSES }
