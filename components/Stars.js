import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa'

/* Read-only star rating, e.g. 4.5 → ★★★★½ */
export default function Stars({ rating, size = 12, className = '' }) {
  const stars = [1, 2, 3, 4, 5].map(n => {
    if (rating >= n) return <FaStar key={n} />
    if (rating >= n - 0.5) return <FaStarHalfAlt key={n} />
    return <FaRegStar key={n} />
  })
  return (
    <span className={`inline-flex text-yellow-500 ${className}`} style={{ fontSize: size }} aria-label={`${rating} out of 5 stars`}>
      {stars}
    </span>
  )
}
