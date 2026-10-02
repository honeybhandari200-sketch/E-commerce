import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Button from '../../components/Button'
import Image from '../../components/Image'
import QuantityPicker from '../../components/QuantityPicker'
import ProductCard from '../../components/ProductCard'
import Reviews from '../../components/Reviews'
import Stars from '../../components/Stars'
import { SiteContext } from '../../context/mainContext'
import { siteName } from '../../ecommerce.config'
import { formatPrice } from '../../utils/currencyProvider'
import { withNav } from '../../lib/nav'
import { getProductBySlug, relatedProducts } from '../../lib/products'
import { reviewsForProduct } from '../../lib/reviews'
import { getUserFromRequest } from '../../lib/auth'

function StockStatus({ stock }) {
  if (stock === 0) return <p className="text-sm font-semibold text-red-600">Out of stock</p>
  if (stock <= 2) return <p className="text-sm font-semibold text-yellow-700">Only {stock} left – order soon</p>
  return <p className="text-sm font-semibold text-green-700">In stock, ready to ship</p>
}

function Specs({ product }) {
  const { material, color, seats, dimensions: d } = product
  const rows = [
    ['Material', material],
    ['Colour', color],
    ['Seats', seats],
    ['Dimensions', d.width && d.depth && d.height ? `${d.width} W × ${d.depth} D × ${d.height} H cm` : null],
    ['Brand', product.brand]
  ].filter(([, value]) => value)
  if (!rows.length) return null
  return (
    <dl className="mt-8 border-t border-gray-200 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex py-2 border-b border-gray-200">
          <dt className="w-32 text-gray-600">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

const ItemView = ({ product, related, reviews, user, context: { addToCart } }) => {
  const [numberOfitems, updateNumberOfItems] = useState(1)
  const { id, slug, price, compareAtPrice, image, name, description, stock, rating, reviewCount } = product
  const soldOut = stock === 0

  function addItemToCart() {
    addToCart({ id, slug, name, image, price, stock, quantity: numberOfitems })
  }

  function increment() {
    if (numberOfitems >= stock) return
    updateNumberOfItems(numberOfitems + 1)
  }

  function decrement() {
    if (numberOfitems === 1) return
    updateNumberOfItems(numberOfitems - 1)
  }

  return (
    <>
      <Head>
        <title>{siteName} - {name}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${siteName} - ${name}`} key="title" />
      </Head>
      <div className="
        sm:py-12
        md:flex-row
        py-4 w-full flex flex-1 flex-col my-0 mx-auto
      ">
        <div className="w-full md:w-1/2 h-120 flex flex-1 bg-light hover:bg-light-200">
          <div className="py-16 p10 flex flex-1 justify-center items-center">
            <Image src={image} alt={name} className="max-h-full" />
          </div>
        </div>
        <div className="pt-2 px-0 md:px-10 pb-8 w-full md:w-1/2">
          <h1 className="
           sm:mt-0 mt-2 text-5xl font-light leading-large
          ">{name}</h1>
          {reviewCount > 0 && (
            <a href="#reviews" className="mt-2 inline-flex items-center text-sm text-gray-600 hover:underline">
              <Stars rating={rating} size={14} className="mr-2" />
              {rating} · {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </a>
          )}
          <h2 className="text-2xl tracking-wide sm:pt-8 pt-6 pb-2">
            {compareAtPrice && <span className="mr-3 text-gray-400 line-through">{formatPrice(compareAtPrice)}</span>}
            <span className={compareAtPrice ? 'text-red-600' : ''}>{formatPrice(price)}</span>
          </h2>
          <div className="mb-6"><StockStatus stock={stock} /></div>
          <p className="text-gray-600 leading-7">{description}</p>
          {!soldOut && (
            <div className="my-6">
              <QuantityPicker
                increment={increment}
                decrement={decrement}
                numberOfitems={numberOfitems}
              />
            </div>
          )}
          {soldOut ? (
            <p className="my-6 py-4 text-center bg-light text-gray-600 font-semibold">Sold out – check back soon</p>
          ) : (
            <Button full title="Add to Cart" onClick={addItemToCart} />
          )}
          <p className="mt-4 text-xs text-gray-500">Free delivery · Easy returns within 30 days</p>
          <Specs product={product} />
        </div>
      </div>

      <Reviews productId={id} initialReviews={reviews} user={user} productSlug={slug} />

      {related.length > 0 && (
        <div className="pt-16">
          <h2 className="text-3xl mb-6">You may also like</h2>
          <div className="grid gap-x-4 gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="mt-8 text-center">
            <Link href="/search"><a className="text-sm underline">Shop all sofas</a></Link>
          </div>
        </div>
      )}
    </>
  )
}

export async function getServerSideProps ({ params, req }) {
  const product = await getProductBySlug(params.name)
  if (!product) return { notFound: true }
  const [related, reviews] = await Promise.all([relatedProducts(product), reviewsForProduct(product.id)])
  const user = getUserFromRequest(req)
  return withNav({
    props: {
      product,
      related,
      reviews,
      user: user ? { id: user.id, name: user.name } : null
    }
  })
}

function ItemViewWithContext(props) {
  return (
    <SiteContext.Consumer>
      {
        context => <ItemView {...props} context={context} />
      }
    </SiteContext.Consumer>
  )
}

export default ItemViewWithContext
