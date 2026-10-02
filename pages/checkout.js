import { useState, useEffect } from 'react'
import Head from 'next/head'
import { SiteContext } from "../context/mainContext"
import DENOMINATION from "../utils/currencyProvider"
import {
  FaLongArrowAltLeft, FaUser, FaCreditCard, FaCalendarAlt, FaLock,
  FaEnvelope, FaMapMarkerAlt, FaPhone, FaCheck, FaShieldAlt, FaArrowRight
} from "react-icons/fa"
import Link from "next/link"
import Image from "../components/Image"
import Receipt from "../components/Receipt"
import PaymentCard from "../components/PaymentCard"
import { getUserFromRequest } from "../lib/auth"
import { withNav } from "../lib/nav"
import { siteName } from "../ecommerce.config"

import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null

// How long the "Paid" card shows before the receipt starts printing
const PAID_CELEBRATION_MS = 2400

function CheckoutWithContext(props) {
  return (
    <SiteContext.Consumer>
      {context => (
        <Elements stripe={stripePromise}>
          <Checkout {...props} context={context} />
        </Elements>
      )}
    </SiteContext.Consumer>
  )
}

const money = dollars => DENOMINATION + Number(dollars).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const stripeStyle = {
  style: {
    base: {
      fontSize: "15px",
      color: "#111827",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      letterSpacing: "0.04em",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: "#dc2626" },
  },
}

const Label = ({ children, hint }) => (
  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
    {children}
    {hint && <span className="ml-2 normal-case tracking-normal font-normal text-gray-400">{hint}</span>}
  </p>
)

const TextField = ({ icon: Icon, onFocus, onBlur, ...props }) => {
  const [focused, setFocused] = useState(false)
  return (
    <div className={`stripe-field ${focused ? "is-focused" : ""}`}>
      <Icon className="mr-3 text-gray-400 flex-shrink-0" size={13} />
      <input
        {...props}
        onFocus={e => { setFocused(true); onFocus && onFocus(e) }}
        onBlur={e => { setFocused(false); onBlur && onBlur(e) }}
        className="flex-1 min-w-0 text-sm text-gray-900 bg-transparent focus:outline-none"
      />
    </div>
  )
}

const StripeField = ({ icon: Icon, focused, invalid, children, right }) => (
  <div className={`stripe-field ${focused ? "is-focused" : ""} ${invalid ? "is-invalid" : ""}`}>
    <Icon className="mr-3 text-gray-400 flex-shrink-0" size={13} />
    {children}
    {right}
  </div>
)

const Stepper = () => (
  <div className="flex items-center text-xs sm:text-sm">
    {["Cart", "Sign in"].map(step => (
      <span key={step} className="flex items-center mr-2 text-gray-600">
        <span className="flex items-center justify-center w-5 h-5 mr-2 rounded-full bg-green-600 text-white">
          <FaCheck size={9} />
        </span>
        {step}
        <span className="ml-2 w-5 border-t border-gray-300" />
      </span>
    ))}
    <span className="flex items-center font-semibold">
      <span className="flex items-center justify-center w-5 h-5 mr-2 rounded-full bg-blue-600 text-white text-xs">3</span>
      Payment
    </span>
  </div>
)

const emptyField = { complete: false, empty: true, error: null }

const Checkout = ({ context, user }) => {
  const [errorMessage, setErrorMessage] = useState(null)
  const [completedOrder, setCompletedOrder] = useState(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [renderClientSideComponent, setRenderClientSideComponent] = useState(false)
  const [input, setInput] = useState({
    name: user ? user.name : "",
    email: user ? user.email : "",
    address: "",
    phone: "",
  })

  // Live card preview state, driven by Stripe's change/focus events
  const [focused, setFocused] = useState(null)
  const [brand, setBrand] = useState("unknown")
  const [typingTick, setTypingTick] = useState(0)
  const [fields, setFields] = useState({ number: emptyField, expiry: emptyField, cvc: emptyField })
  const [preview, setPreview] = useState(null) // { last4, expiry } once the card is complete

  const stripe = useStripe()
  const elements = useElements()

  useEffect(() => {
    setRenderClientSideComponent(true)
  }, [])

  // When every card field is complete, ask Stripe for the last 4 digits and
  // expiry so they can be shown on the card. (We never see the full number.)
  const allComplete = fields.number.complete && fields.expiry.complete && fields.cvc.complete
  useEffect(() => {
    if (!allComplete || !stripe || !elements) {
      if (!fields.number.complete) setPreview(null)
      return
    }
    let cancelled = false
    stripe.createPaymentMethod({ type: "card", card: elements.getElement(CardNumberElement) })
      .then(({ paymentMethod }) => {
        if (cancelled || !paymentMethod) return
        const { last4, exp_month, exp_year } = paymentMethod.card
        setPreview({ last4, expiry: `${String(exp_month).padStart(2, "0")}/${String(exp_year).slice(-2)}` })
      })
    return () => { cancelled = true }
  }, [allComplete, stripe, elements])

  // Paid → show the glowing card briefly, then print the receipt
  useEffect(() => {
    if (!completedOrder) return
    const timer = setTimeout(() => setShowReceipt(true), PAID_CELEBRATION_MS)
    return () => clearTimeout(timer)
  }, [completedOrder])

  const onChange = e => {
    setErrorMessage(null)
    setInput({ ...input, [e.target.name]: e.target.value })
  }

  const onCardChange = field => event => {
    setErrorMessage(null)
    setFields(prev => ({ ...prev, [field]: { complete: event.complete, empty: event.empty, error: event.error } }))
    if (field === "number") {
      setBrand(event.brand)
      setTypingTick(tick => tick + 1)
    }
  }

  const handleSubmit = async event => {
    event.preventDefault()
    if (submitting) return
    const { name, email, address, phone } = input
    const { cart, clearCart } = context

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return
    }

    // Validate input
    if (!name.trim()) {
      setErrorMessage("Please enter the cardholder name.")
      return
    }
    if (!address.trim()) {
      setErrorMessage("Please enter your delivery address.")
      return
    }
    if (phone.replace(/\D/g, "").length < 7) {
      setErrorMessage("Please enter a valid phone number.")
      return
    }

    setSubmitting(true)
    setFocused(null)
    const fail = message => {
      setErrorMessage(message)
      setSubmitting(false)
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardNumberElement),
      billing_details: { name },
    })

    if (error) return fail(error.message)

    // The server prices the order itself; only product ids and quantities are sent.
    const order = {
      email,
      items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
      name,
      address,
      phone,
      payment_method_id: paymentMethod.id,
    }

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    })
    if (res.status === 401) {
      window.location.href = "/login?next=/checkout"
      return
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return fail(data.error || "Could not place your order. Please try again.")

    // Some cards need extra verification (3D Secure) before the charge completes.
    let paidOrder = data.order
    if (data.requiresAction) {
      const { error: actionError } = await stripe.confirmCardPayment(data.clientSecret)
      if (actionError) return fail(actionError.message)
      const confirmRes = await fetch("/api/orders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.order.id }),
      })
      const confirmed = await confirmRes.json().catch(() => ({}))
      if (!confirmRes.ok) return fail(confirmed.error || "Payment was not completed.")
      paidOrder = confirmed.order
    }

    setPreview({ last4: paidOrder.card ? paidOrder.card.last4 : preview && preview.last4, expiry: preview && preview.expiry })
    setCompletedOrder(paidOrder)
    clearCart()
    window.scrollTo(0, 0)
  }

  const { numberOfItemsInCart, cart, total } = context
  const cartEmpty = numberOfItemsInCart === Number(0)

  if (!renderClientSideComponent) return null

  const card = (status, focusedField = focused) => (
    <PaymentCard
      brand={brand}
      name={input.name}
      last4={preview && preview.last4}
      expiry={preview && preview.expiry}
      focused={focusedField}
      typingTick={typingTick}
      numberComplete={fields.number.complete}
      cvcComplete={fields.cvc.complete}
      status={status}
    />
  )

  if (completedOrder && showReceipt) {
    return (
      <>
        <Head>
          <title>{siteName} - Receipt</title>
        </Head>
        <Receipt order={completedOrder} animate />
      </>
    )
  }

  if (completedOrder) {
    const paidCard = completedOrder.card
    return (
      <div className="py-12 sm:py-20 flex flex-col items-center text-center">
        <Head>
          <title>{siteName} - Paid</title>
        </Head>
        <div className="w-full max-w-sm px-4">{card("paid", null)}</div>
        <div className="checkout-paid-enter mt-10 flex items-center justify-center w-10 h-10 rounded-full bg-green-600 text-white" style={{ animationDelay: ".3s" }}>
          <FaCheck />
        </div>
        <p className="checkout-paid-enter mt-4 text-2xl font-semibold" style={{ animationDelay: ".45s" }}>
          Paid {money(completedOrder.amount / 100)}
        </p>
        <p className="checkout-paid-enter mt-1 text-sm text-gray-500" style={{ animationDelay: ".6s" }}>
          {paidCard ? `${paidCard.brand.toUpperCase()} •••• ${paidCard.last4} · ` : ""}printing your receipt…
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-10">
      <Head>
        <title>{siteName} - Checkout</title>
        <meta name="description" content={`Check out`} />
        <meta property="og:title" content={`${siteName} - Checkout`} key="title" />
      </Head>

      <div className="pt-4 pb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl font-light mb-4">Checkout</h1>
          <Link href="/cart">
            <a aria-label="Cart" className="flex items-center text-gray-600 text-sm hover:text-gray-900">
              <FaLongArrowAltLeft className="mr-2" />
              Edit cart
            </a>
          </Link>
        </div>
        <Stepper />
      </div>

      {cartEmpty ? (
        <div className="py-16 flex flex-col items-center text-center bg-light">
          <h3 className="text-2xl mb-2">Your cart is empty</h3>
          <p className="text-gray-600 text-sm mb-8">Add something to your cart to check out.</p>
          <Link href="/categories">
            <a className="px-8 py-3 border-2 border-gray-900 text-sm font-semibold hover:bg-gray-900 hover:text-white transition-colors">
              Continue shopping
            </a>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Left: live card + order summary */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-200 px-6 py-10 sm:px-12 flex flex-col items-center">
            <div className="w-full max-w-sm">{card(submitting ? "processing" : null)}</div>

            <div className="w-full max-w-sm mt-10 bg-white rounded-xl shadow-sm p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Your order</p>
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center">
                    <div className="w-12 h-12 mr-3 flex items-center justify-center bg-light rounded-lg flex-shrink-0">
                      <Image className="w-10" src={item.image} alt={item.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm pl-3">{money(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-gray-600">Total due today</span>
                  <span className="text-2xl font-semibold">{money(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <form onSubmit={handleSubmit} className="bg-white px-6 py-10 sm:px-12">
            <h2 className="text-2xl font-semibold mb-1">Payment details</h2>
            <p className="text-sm text-gray-500 mb-8">Enter your card to complete the purchase.</p>

            <div className="space-y-5">
              <div>
                <Label>Cardholder name</Label>
                <TextField
                  icon={FaUser}
                  name="name"
                  value={input.name}
                  onChange={onChange}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                  autoComplete="cc-name"
                  placeholder="Name on card"
                />
              </div>

              <div>
                <Label>Card number</Label>
                <StripeField
                  icon={FaCreditCard}
                  focused={focused === "number"}
                  invalid={!!fields.number.error}
                  right={brand && brand !== "unknown" && (
                    <span className="ml-3 text-xs font-semibold italic text-blue-900 uppercase">{brand}</span>
                  )}
                >
                  <CardNumberElement
                    options={{ ...stripeStyle, placeholder: "4242 4242 4242 4242" }}
                    onChange={onCardChange("number")}
                    onFocus={() => setFocused("number")}
                    onBlur={() => setFocused(null)}
                  />
                </StripeField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Expiry date</Label>
                  <StripeField icon={FaCalendarAlt} focused={focused === "expiry"} invalid={!!fields.expiry.error}>
                    <CardExpiryElement
                      options={stripeStyle}
                      onChange={onCardChange("expiry")}
                      onFocus={() => setFocused("expiry")}
                      onBlur={() => setFocused(null)}
                    />
                  </StripeField>
                </div>
                <div>
                  <Label hint="back of card">CVC</Label>
                  <StripeField icon={FaLock} focused={focused === "cvc"} invalid={!!fields.cvc.error}>
                    <CardCvcElement
                      options={{ ...stripeStyle, placeholder: "123" }}
                      onChange={onCardChange("cvc")}
                      onFocus={() => setFocused("cvc")}
                      onBlur={() => setFocused(null)}
                    />
                  </StripeField>
                </div>
              </div>

              <p className="pt-3 text-xs font-semibold uppercase tracking-wider text-gray-400 border-t border-gray-100">Delivery</p>

              <div>
                <Label>Email</Label>
                <TextField icon={FaEnvelope} name="email" type="email" value={input.email} onChange={onChange} autoComplete="email" placeholder="you@example.com" />
              </div>
              <div>
                <Label>Delivery address</Label>
                <TextField icon={FaMapMarkerAlt} name="address" value={input.address} onChange={onChange} autoComplete="street-address" placeholder="House, street, city" />
              </div>
              <div>
                <Label>Phone number</Label>
                <TextField icon={FaPhone} name="phone" type="tel" value={input.phone} onChange={onChange} autoComplete="tel" placeholder="+977 98XXXXXXXX" />
              </div>
            </div>

            {(errorMessage || fields.number.error || fields.expiry.error || fields.cvc.error) && (
              <p role="alert" className="mt-5 text-sm text-red-600">
                {errorMessage || (fields.number.error || fields.expiry.error || fields.cvc.error).message}
              </p>
            )}

            <button
              type="submit"
              disabled={!stripe || submitting}
              className="
                mt-8 w-full flex items-center justify-center py-4 rounded-xl
                bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold
                shadow-lg hover:from-blue-600 hover:to-blue-800 transition-colors
                focus:outline-none disabled:opacity-60
              "
            >
              <FaLock className="mr-2" size={12} />
              {submitting ? "Processing…" : `Pay ${money(total)}`}
              {!submitting && <FaArrowRight className="ml-2" size={12} />}
            </button>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="flex items-center"><FaShieldAlt className="mr-1 text-green-600" /> Secured by Stripe</span>
              <span className="flex items-center"><FaLock className="mr-1" /> Encrypted connection</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">Your card number never touches our servers.</p>
          </form>
        </div>
      )}
    </div>
  )
}

/* Buying requires a signed-in user: redirect to login otherwise. */
export async function getServerSideProps({ req }) {
  const user = getUserFromRequest(req)
  if (!user) {
    return { redirect: { destination: "/login?next=/checkout", permanent: false } }
  }
  return withNav({ props: { user } })
}

export default CheckoutWithContext
