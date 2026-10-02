import { toast } from 'react-toastify'
import React from 'react'
const STORAGE_KEY = 'NEXT_ECOMMERCE_STARTER_'

const initialState = {
  cart: [],
  numberOfItemsInCart: 0,
  total: 0
}

const SiteContext = React.createContext()

function calculateTotal(cart) {
  const total = cart.reduce((acc, next) => {
    const quantity = next.quantity
    acc = acc + Number(next.price) * quantity
    return acc
  }, 0)
  return total
}

class ContextProviderComponent extends React.Component {
  componentDidMount() {
    if (typeof window !== 'undefined') {
      const storageState = window.localStorage.getItem(STORAGE_KEY)
      if (!storageState) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState))
      }
    }
  }

  setItemQuantity = (item) => {
    const storageState = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    const { cart } = storageState
    const index = cart.findIndex(cartItem => cartItem.id === item.id)
    cart[index].quantity = item.quantity
    this.saveCart(cart)
  }

  addToCart = item => {
    const storageState = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    const { cart } = storageState
    const index = cart.findIndex(cartItem => cartItem.id === item.id)
    const inCart = index >= 0 ? cart[index].quantity : 0
    /* Never put more in the cart than there is in stock */
    const quantity = Math.min(inCart + item.quantity, item.stock)
    if (quantity <= inCart) {
      toast(`You already have all ${item.stock} in your cart.`, {
        position: toast.POSITION.TOP_LEFT
      })
      return
    }
    if (index >= 0) {
      cart[index] = { ...cart[index], ...item, quantity }
    } else {
      cart.push({ ...item, quantity })
    }

    this.saveCart(cart)
    toast("Successfully added item to cart!", {
      position: toast.POSITION.TOP_LEFT
    })
  }

  /* Refresh cart lines with current products from the server: new prices and
     stock, and drop sofas that are gone. Returns the names of removed items. */
  syncCart = products => {
    const storageState = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    const removed = []
    const cart = storageState.cart.reduce((acc, item) => {
      const product = products.find(p => p.id === item.id)
      if (!product || product.stock === 0) {
        removed.push(item.name)
        return acc
      }
      const { id, slug, name, image, price, stock } = product
      acc.push({ id, slug, name, image, price, stock, quantity: Math.min(item.quantity, stock) })
      return acc
    }, [])
    this.saveCart(cart)
    return removed
  }

  saveCart = cart => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      cart, numberOfItemsInCart: cart.length, total: calculateTotal(cart)
    }))
    this.forceUpdate()
  }

  removeFromCart = (item) => {
    const storageState = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    let { cart } = storageState
    cart = cart.filter(c => c.id !== item.id)
    this.saveCart(cart)
  }

  clearCart = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState))
    this.forceUpdate()
  }

  render() {
    let state = initialState
    if (typeof window !== 'undefined') {
      const storageState = window.localStorage.getItem(STORAGE_KEY)
      if (storageState) {
        state = JSON.parse(storageState)
      }
    }

    return (
      <SiteContext.Provider value={{
        ...state,
         addToCart: this.addToCart,
         clearCart: this.clearCart,
         removeFromCart: this.removeFromCart,
         setItemQuantity: this.setItemQuantity,
         syncCart: this.syncCart
      }}>
       {this.props.children}
     </SiteContext.Provider>
    )
  }
}

export {
  SiteContext,
  ContextProviderComponent
}