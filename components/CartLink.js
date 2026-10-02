import { useState, useEffect } from 'react'
import { SiteContext } from '../context/mainContext'
import { FaShoppingCart } from 'react-icons/fa'
import Link from 'next/link'

function CartLink({ context: { numberOfItemsInCart = 0 } }) {
  const [renderClientSideComponent, setRenderClientSideComponent] = useState(false)
  useEffect(() => {
    setRenderClientSideComponent(true)
  }, [])
  const showCount = renderClientSideComponent && numberOfItemsInCart > 0
  return (
    <Link href="/cart">
      <a aria-label="Cart" className="relative flex items-center p-2 -mr-2 text-gray-900 hover:text-gray-600">
        <FaShoppingCart size={18} />
        {
          showCount && (
            <span className="
              absolute top-0 right-0 flex items-center justify-center
              h-4 min-w-4 px-1 rounded-full bg-primary
              text-xxs font-semibold text-gray-900
            ">
              {numberOfItemsInCart}
            </span>
          )
        }
      </a>
    </Link>
  )
}

function CartLinkWithContext(props) {
  return (
    <SiteContext.Consumer>
      {
        context => <CartLink {...props} context={context} />
      }
    </SiteContext.Consumer>
  )
}

export default CartLinkWithContext
