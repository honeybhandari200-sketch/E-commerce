import Link from 'next/link'
import Image from './Image'
import Stars from './Stars'
import { formatPrice } from '../utils/currencyProvider'

/* One sofa in a product grid. */
export default function ProductCard({ product }) {
  const { slug, name, image, price, compareAtPrice, stock, rating, reviewCount } = product
  const badge = stock === 0 ? 'Sold out' : compareAtPrice ? 'Sale' : stock <= 2 ? `Only ${stock} left` : null

  return (
    <div>
      <Link href={`/product/${slug}`}>
        <a aria-label={name} className="relative h-72 flex justify-center items-center bg-light hover:bg-light-200 transition-colors">
          {badge && (
            <span className={`absolute top-3 left-3 px-2 py-1 text-xxs font-semibold uppercase tracking-wider ${
              stock === 0 ? 'bg-gray-900 text-white' : compareAtPrice ? 'bg-red-600 text-white' : 'bg-yellow-100 text-yellow-800'
            }`}>{badge}</span>
          )}
          <Image alt={name} src={image} className={`w-3/5 ${stock === 0 ? 'opacity-50' : ''}`} />
        </a>
      </Link>
      <div className="text-center">
        <Link href={`/product/${slug}`}>
          <a className="block mt-4 text-lg font-semibold mb-1 hover:underline">{name}</a>
        </Link>
        <p className="text-gray-700">
          {compareAtPrice && <span className="mr-2 text-gray-400 line-through">{formatPrice(compareAtPrice)}</span>}
          <span className={compareAtPrice ? 'text-red-600' : ''}>{formatPrice(price)}</span>
        </p>
        {reviewCount > 0 && (
          <p className="mt-1 flex items-center justify-center text-xs text-gray-500">
            <Stars rating={rating} className="mr-1" /> ({reviewCount})
          </p>
        )}
      </div>
    </div>
  )
}
