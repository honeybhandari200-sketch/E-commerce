import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FaSearch } from 'react-icons/fa'
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer } from 'react-toastify'
import { navItemLength, siteName } from '../ecommerce.config'
import CartLink from '../components/CartLink'
import { useRouter } from 'next/router'
import { useAuth } from '../context/authContext'

export default function Layout({ children, categories }) {
  const navCategories = categories.slice(0, navItemLength)
  const year = new Date().getFullYear()
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [search, setSearch] = useState('')

  // Keep the box in sync with the search page's query, and clear it elsewhere
  useEffect(() => {
    setSearch(router.pathname === '/search' ? router.query.q || '' : '')
  }, [router.pathname, router.query.q])

  function submitSearch(event) {
    event.preventDefault()
    if (search.trim()) router.push({ pathname: '/search', query: { q: search.trim() } })
  }

  async function signOut() {
    await logout()
    router.push('/')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <nav className="site-container flex items-center py-4 sm:py-6">
          <Link href="/">
            <a aria-label="Home" className="flex-shrink-0 mr-8 sm:mr-14">
              <img src="/logo.png" alt="logo" width="90" height="28" />
            </a>
          </Link>
          <div className="flex flex-1 min-w-0 overflow-x-auto whitespace-nowrap -my-2 py-2">
            <Link href="/">
              <a aria-label="Home" className="nav-link">Home</a>
            </Link>
            {
              navCategories.map((category) => (
                <Link href={`/category/${category.slug}`} key={category.slug}>
                  <a className="nav-link">{category.name}</a>
                </Link>
              ))
            }
            <Link href="/categories">
              <a aria-label="All categories" className="nav-link">All</a>
            </Link>
          </div>
          <div className="flex-shrink-0 flex items-center ml-4">
            <form onSubmit={submitSearch} role="search" className="hidden lg:flex items-center mr-6 border border-gray-300 rounded-full px-3 py-1 focus-within:border-gray-900">
              <FaSearch className="text-gray-400 mr-2" size={12} />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search sofas"
                aria-label="Search sofas"
                className="w-36 text-sm bg-transparent focus:outline-none"
              />
            </form>
            <Link href="/search">
              <a aria-label="Search" className="lg:hidden p-2 mr-2 text-gray-900 hover:text-gray-600"><FaSearch size={16} /></a>
            </Link>
            {
              !loading && (user ? (
                <div className="flex items-center mr-4 sm:mr-6 text-smaller">
                  <span className="hidden md:inline text-gray-700 mr-6">Hi, {user.name.split(' ')[0]}</span>
                  {user.isAdmin && (
                    <Link href="/admin">
                      <a className="nav-link">Admin</a>
                    </Link>
                  )}
                  <Link href="/orders">
                    <a className="nav-link">Orders</a>
                  </Link>
                  <button onClick={signOut} className="hidden sm:inline nav-link mr-0 focus:outline-none">Sign out</button>
                </div>
              ) : (
                <Link href="/login">
                  <a className="nav-link mr-4 sm:mr-6">Sign in</a>
                </Link>
              ))
            }
            <CartLink />
          </div>
        </nav>
      </header>

      <main className="site-container flex-1 pt-6 sm:pt-8 pb-16">{children}</main>

      <footer className="border-t border-gray-200 bg-light">
        <div className="site-container py-10 grid gap-8 grid-cols-1 sm:grid-cols-3">
          <div>
            <img src="/logo.png" alt="logo" width="72" height="22" className="mb-4" />
            <p className="text-sm text-gray-600 leading-relaxed max-w-64">
              Modern sofas, loveseats and daybeds, delivered free to your door.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-4">Shop</h4>
            <ul className="space-y-2">
              {
                navCategories.map((category) => (
                  <li key={category.slug}>
                    <Link href={`/category/${category.slug}`}>
                      <a className="footer-link">{category.name}</a>
                    </Link>
                  </li>
                ))
              }
              <li>
                <Link href="/categories">
                  <a className="footer-link">All categories</a>
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-4">Account</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/cart">
                  <a className="footer-link">Cart</a>
                </Link>
              </li>
              {
                user ? (
                  <>
                    <li>
                      <Link href="/orders">
                        <a className="footer-link">Order history</a>
                      </Link>
                    </li>
                    <li>
                      <button onClick={signOut} className="footer-link focus:outline-none">Sign out</button>
                    </li>
                  </>
                ) : (
                  <li>
                    <Link href="/login">
                      <a className="footer-link">Sign in</a>
                    </Link>
                  </li>
                )
              }
              {
                user && user.isAdmin && (
                  <li>
                    <Link href="/admin">
                      <a aria-label="Admin panel" className="footer-link">Admin</a>
                    </Link>
                  </li>
                )
              }
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <p className="site-container py-6 text-xs text-gray-500">
            © {year} {siteName}. All rights reserved.
          </p>
        </div>
      </footer>
      <ToastContainer autoClose={3000} />
    </div>
  )
}
