import { useState } from 'react'
import Link from 'next/link'
import { FaStar, FaCheckCircle } from 'react-icons/fa'
import Stars from './Stars'

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex text-2xl" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          type="button"
          key={n}
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className={`mr-1 focus:outline-none ${(hover || value) >= n ? 'text-yellow-500' : 'text-gray-300'}`}
        >
          <FaStar />
        </button>
      ))}
    </div>
  )
}

function ReviewForm({ productId, existing, onSaved }) {
  const [form, setForm] = useState({
    rating: existing ? existing.rating : 0,
    title: existing ? existing.title : '',
    body: existing ? existing.body : ''
  })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/products/${productId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) return setError(data.error || 'Could not save your review.')
    onSaved(data.reviews)
  }

  const field = 'w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-900'
  return (
    <form onSubmit={submit} className="bg-light p-6 max-w-xl">
      <p className="font-semibold mb-3">{existing ? 'Update your review' : 'Write a review'}</p>
      <StarInput value={form.rating} onChange={rating => setForm({ ...form, rating })} />
      <input
        className={`${field} mt-4`} placeholder="Headline (optional)" maxLength={120}
        value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
      />
      <textarea
        className={`${field} mt-3 h-28`} placeholder="How does it look and feel? How was delivery?" maxLength={2000}
        value={form.body} onChange={e => setForm({ ...form, body: e.target.value })}
      />
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="submit" disabled={saving}
        className="mt-4 px-6 py-2 bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-60 focus:outline-none"
      >
        {saving ? 'Saving…' : existing ? 'Update review' : 'Post review'}
      </button>
    </form>
  )
}

export default function Reviews({ productId, productSlug, initialReviews, user }) {
  const [reviews, setReviews] = useState(initialReviews)
  const [editing, setEditing] = useState(false)
  const mine = user && reviews.find(r => r.userId === user.id)
  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

  return (
    <section id="reviews" className="pt-12 border-t border-gray-200">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl">Reviews</h2>
          {reviews.length > 0 && (
            <p className="mt-1 flex items-center text-sm text-gray-600">
              <Stars rating={Math.round(average * 2) / 2} size={14} className="mr-2" />
              {average.toFixed(1)} out of 5 · {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
          )}
        </div>
        {user && !editing && (
          <button onClick={() => setEditing(true)} className="px-6 py-2 border-2 border-gray-900 text-sm font-semibold hover:bg-gray-900 hover:text-white focus:outline-none">
            {mine ? 'Edit your review' : 'Write a review'}
          </button>
        )}
        {!user && (
          <Link href={`/login?next=/product/${productSlug}`}>
            <a className="text-sm underline">Sign in to write a review</a>
          </Link>
        )}
      </div>

      {editing && (
        <div className="mb-8">
          <ReviewForm productId={productId} existing={mine} onSaved={updated => { setReviews(updated); setEditing(false) }} />
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-gray-600 text-sm">No reviews yet. Be the first to share your thoughts.</p>
      ) : (
        <div className="divide-y divide-gray-200">
          {reviews.map(review => (
            <article key={review.id} className="py-5 max-w-2xl">
              <Stars rating={review.rating} />
              {review.title && <p className="mt-1 font-semibold">{review.title}</p>}
              <p className="mt-1 text-gray-700 text-sm leading-6 whitespace-pre-line">{review.body}</p>
              <p className="mt-2 text-xs text-gray-500 flex items-center">
                {review.author} · {new Date(review.createdAt).toLocaleDateString()}
                {review.verified && <span className="ml-3 flex items-center text-green-700"><FaCheckCircle className="mr-1" /> Verified buyer</span>}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
