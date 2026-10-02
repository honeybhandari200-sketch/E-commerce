const DENOMINATION = '$'

/* Formats a dollar amount as "$1,234.00". */
function formatPrice(dollars) {
  return DENOMINATION + Number(dollars).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export { formatPrice }
export default DENOMINATION
