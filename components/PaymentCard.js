/* Visual credit card that mirrors what the shopper is typing.
   Stripe keeps the real card number inside its secure iframes, so the card
   shows the brand, typing activity, and (once complete) the last 4 + expiry. */

const BRANDS = {
  visa: { label: 'VISA', theme: 'card-theme-visa' },
  mastercard: { label: 'mastercard', theme: 'card-theme-mastercard' },
  amex: { label: 'AMEX', theme: 'card-theme-amex' },
  discover: { label: 'DISCOVER', theme: 'card-theme-discover' },
  diners: { label: 'DINERS', theme: 'card-theme-default' },
  jcb: { label: 'JCB', theme: 'card-theme-default' },
  unionpay: { label: 'UnionPay', theme: 'card-theme-default' }
}

function NumberGroups({ last4, typing, complete }) {
  const groups = ['••••', '••••', '••••', last4 || '••••']
  return (
    <div className={`payment-card-number ${typing && !complete ? 'is-typing' : ''} ${complete ? 'is-complete' : ''}`}>
      {groups.map((group, i) => (
        <span key={i} style={{ transitionDelay: `${i * 60}ms` }}>{group}</span>
      ))}
    </div>
  )
}

export default function PaymentCard({
  brand,
  name,
  last4,
  expiry,
  focused,
  typingTick,
  numberComplete,
  cvcComplete,
  status
}) {
  const brandInfo = BRANDS[brand] || { label: '', theme: 'card-theme-default' }
  const flipped = focused === 'cvc'

  return (
    <div className={`payment-card-scene ${status ? `is-${status}` : ''}`}>
      <div className={`payment-card ${flipped ? 'is-flipped' : ''}`}>
        {/* Front */}
        <div className={`payment-card-face payment-card-front ${brandInfo.theme}`}>
          <div className="payment-card-sheen" />
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="payment-card-chip" />
              <div className="payment-card-contactless" aria-hidden="true"><span /><span /><span /></div>
            </div>
            <div className="text-right">
              <p className="payment-card-store">JSEC</p>
              <p className="payment-card-tier">RESERVE</p>
            </div>
          </div>

          <div className={`payment-card-field-number ${focused === 'number' ? 'is-focused' : ''}`}>
            {/* key changes on every keystroke so the shimmer replays */}
            <NumberGroups key={typingTick} last4={last4} typing={typingTick > 0} complete={numberComplete} />
          </div>

          <div className="flex items-end justify-between">
            <div className="flex" style={{ gap: 22 }}>
              <div className={`payment-card-field ${focused === 'name' ? 'is-focused' : ''}`}>
                <p className="payment-card-label">Cardholder</p>
                <p className="payment-card-value payment-card-name">{name ? name.toUpperCase() : 'YOUR NAME'}</p>
              </div>
              <div className={`payment-card-field ${focused === 'expiry' ? 'is-focused' : ''}`}>
                <p className="payment-card-label">Expires</p>
                <p className="payment-card-value">{expiry || 'MM/YY'}</p>
              </div>
            </div>
            <p key={brand} className="payment-card-brand">{brandInfo.label}</p>
          </div>
        </div>

        {/* Back */}
        <div className={`payment-card-face payment-card-back ${brandInfo.theme}`}>
          <div className="payment-card-stripe" />
          <div className="payment-card-signature">
            <div className="payment-card-signature-lines" />
            <div className={`payment-card-cvc ${cvcComplete ? 'is-complete' : ''}`}>
              {cvcComplete ? '•••' : '___'}
            </div>
          </div>
          <p className="payment-card-back-note">
            The security code is kept by Stripe and never reaches this store.
          </p>
          <p className="payment-card-brand payment-card-brand-back">{brandInfo.label}</p>
        </div>
      </div>
      <div className="payment-card-glow" aria-hidden="true" />
    </div>
  )
}
