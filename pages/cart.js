import Link from 'next/link'
import { useState, useEffect } from 'react'
import { FaTimes, FaLongArrowAltRight } from 'react-icons/fa'
import { SiteContext } from '../context/mainContext'
import { toast } from 'react-toastify'
import { formatPrice } from '../utils/currencyProvider'
import QuantityPicker from '../components/QuantityPicker'
import Image from '../components/Image'
import Head from 'next/head'
import { useAuth } from '../context/authContext'
import { siteName } from '../ecommerce.config'
import { withNav } from '../lib/nav'

const Cart = ({ context }) => {
  const [renderClientSideComponent, setRenderClientSideComponent] = useState(false)
  const {
    numberOfItemsInCart, cart, removeFromCart, total, setItemQuantity, syncCart
  } = context

  // Prices and stock may have changed since items were added: refresh them.
  useEffect(() => {
    setRenderClientSideComponent(true)
    if (!cart.length) return
    fetch('/api/products/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: cart.map(item => item.id) })
    })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data) return
        const removed = syncCart(data.products)
        if (removed.length) {
          toast(`Removed from your cart (no longer available): ${removed.join(', ')}`, { position: toast.POSITION.TOP_LEFT })
        }
      })
      .catch(() => {})
  }, [])
  const cartEmpty = numberOfItemsInCart === Number(0)
  const { user } = useAuth()
  const checkoutHref = user ? '/checkout' : '/login?next=/checkout'

  function increment(item) {
    if (item.stock !== undefined && item.quantity >= item.stock) {
      toast(`Only ${item.stock} in stock.`, { position: toast.POSITION.TOP_LEFT })
      return
    }
    item.quantity = item.quantity + 1
    setItemQuantity(item)
  }

  function decrement(item) {
    if (item.quantity === 1) return
    item.quantity = item.quantity - 1
    setItemQuantity(item)
  }

  if (!renderClientSideComponent) return null

  return (
    <>
      <div className="flex flex-col pb-10">
        <Head>
          <title>{siteName} - Cart</title>
          <meta name="description" content={`${siteName} - Shopping cart`} />
          <meta property="og:title" content={`${siteName} - Cart`} key="title" />
        </Head>
        <div className="flex flex-col w-full">
          <div className="pt-4 pb-8">
            <h1 className="text-5xl font-light">Your Cart</h1>
          </div>

          {
            cartEmpty ? (
              <div className="py-16 flex flex-col items-center text-center bg-light">
                <h3 className="text-2xl mb-2">Your cart is empty</h3>
                <p className="text-gray-600 text-sm mb-8">Browse the collection and find something you love.</p>
                <Link href="/categories">
                  <a aria-label="Continue shopping" className="
                    px-8 py-3 border-2 border-gray-900 text-sm font-semibold
                    hover:bg-gray-900 hover:text-white transition-colors
                  ">
                    Continue shopping
                  </a>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col">
                <div>
                  {
                    cart.map((item) => {
                      return (
                        <div className="border-b py-10" key={item.id}>
                          <div className="flex items-center hidden md:flex">
                            <Link href={`/product/${item.slug}`}>
                              <a aria-label={item.name}>
                                <Image className="w-32 m-0" src={item.image} alt={item.name} />
                              </a>
                            </Link>
                            <Link href={`/product/${item.slug}`}>
                              <a aria-label={item.name}>
                                <p className="
                                m-0 pl-10 text-gray-600 w-60
                                ">
                                  {item.name}
                                </p>
                              </a>
                            </Link>
                            <div className="ml-4">
                              <QuantityPicker
                                numberOfitems={item.quantity}
                                increment={() => increment(item)}
                                decrement={() => decrement(item)}
                              />
                            </div>
                            <div className="flex flex-1 justify-end">
                              <p className="m-0 pl-10 text-gray-900 tracking-wider">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                            <div role="button" onClick={() => removeFromCart(item)} className="
                            m-0 ml-10 text-gray-900 text-s cursor-pointer
                            ">
                              <FaTimes />
                            </div>
                          </div>

                          <div className="flex items-center flex md:hidden">
                            <Link href={`/product/${item.slug}`}>
                              <a>
                                <Image className="w-32 m-0" src={item.image} alt={item.name} />
                              </a>
                            </Link>
                            <div>
                              <Link href={`/product/${item.slug}`}>
                                <a aria-label={item.name}>
                                  <p className="
                                  m-0 pl-6 text-gray-600 text-base
                                  ">
                                    {item.name}
                                  </p>
                                </a>
                              </Link>
                              <div className="ml-6 mt-4 mb-2">
                                <QuantityPicker
                                  hideQuantityLabel
                                  numberOfitems={item.quantity}
                                  increment={() => increment(item)}
                                  decrement={() => decrement(item)}
                                />
                              </div>
                              <div className="flex flex-1">
                                <p className="text-lg m-0 pl-6 pt-4 text-gray-900 tracking-wider">
                                  {formatPrice(item.price * item.quantity)}
                                </p>
                              </div>
                            </div>
                            <div role="button" onClick={() => removeFromCart(item)} className="
                            m-0 ml-10 text-gray-900 text-s cursor-pointer mr-2
                            ">
                              <FaTimes />
                            </div>
                          </div>
                        </div>
                      )
                    })
                  }
                </div>  
            </div>
            )
          }
          {!cartEmpty && (
            <div className="flex flex-col items-end">
              <div className="flex items-baseline py-8">
                <p className="text-sm pr-10">Total</p>
                <p className="text-xl font-semibold tracking-wide">{formatPrice(total)}</p>
              </div>
              <Link href={checkoutHref}>
                <a aria-label="Check out" className="
                  flex items-center px-8 py-3 bg-gray-900 text-white text-sm font-semibold
                  hover:bg-gray-700 transition-colors
                ">
                  {user ? 'Proceed to check out' : 'Sign in to check out'}
                  <FaLongArrowAltRight className="ml-2" />
                </a>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function CartWithContext(props) {
  return (
    <SiteContext.Consumer>
      {
        context => <Cart {...props} context={context} />
      }
    </SiteContext.Consumer>
  )
}


export async function getServerSideProps() {
  return withNav({ props: {} })
}

export default CartWithContext