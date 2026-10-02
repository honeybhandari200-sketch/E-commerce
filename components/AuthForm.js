import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../context/authContext'
import { safeRedirectPath } from '../utils/helpers'

const inputClass = `
  w-full mt-2 px-3 py-3 text-sm text-gray-900 bg-white
  border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors
`

const Field = ({ label, ...props }) => (
  <label className="block mb-5">
    <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">{label}</span>
    <input className={inputClass} required {...props} />
  </label>
)

/* Shared sign-in / sign-up form. mode is "login" or "signup". */
export default function AuthForm({ mode }) {
  const router = useRouter()
  const { login, signup } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const isSignup = mode === 'signup'
  const next = safeRedirectPath(router.query.next)
  const nextQuery = next !== '/' ? `?next=${encodeURIComponent(next)}` : ''

  const onChange = e => {
    setError(null)
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const onSubmit = async e => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (isSignup) {
        await signup(form.name, form.email, form.password)
      } else {
        await login(form.email, form.password)
      }
      router.replace(next)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center py-8 sm:py-12">
      <div className="w-full max-w-104">
        <h1 className="text-4xl font-light mb-2">{isSignup ? 'Create an account' : 'Sign in'}</h1>
        <p className="text-sm text-gray-600 mb-8">
          {next === '/checkout'
            ? 'Please sign in to complete your purchase.'
            : isSignup ? 'Sign up to place orders and check out faster.' : 'Welcome back.'}
        </p>

        <form onSubmit={onSubmit}>
          {isSignup && (
            <Field label="Name" name="name" type="text" autoComplete="name" value={form.name} onChange={onChange} />
          )}
          <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} />
          <Field
            label="Password"
            name="password"
            type="password"
            minLength={isSignup ? 8 : undefined}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={form.password}
            onChange={onChange}
          />

          {error && (
            <p role="alert" className="mb-5 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="
              w-full py-3 bg-gray-900 text-white text-sm font-semibold
              hover:bg-gray-700 transition-colors disabled:opacity-50
            "
          >
            {submitting ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-600 text-center">
          {isSignup ? 'Already have an account? ' : 'New here? '}
          <Link href={`${isSignup ? '/login' : '/signup'}${nextQuery}`}>
            <a className="font-semibold text-gray-900 underline">
              {isSignup ? 'Sign in' : 'Create an account'}
            </a>
          </Link>
        </p>
      </div>
    </div>
  )
}
