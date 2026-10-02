import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { FaSearch } from 'react-icons/fa'
import ProductBrowser from '../components/ProductBrowser'
import { siteName } from '../ecommerce.config'
import { withNav } from '../lib/nav'
import { listProducts, listFacets } from '../lib/products'

export default function Search({ q, products, facets }) {
  const router = useRouter()
  const [input, setInput] = useState(q)

  function submit(event) {
    event.preventDefault()
    router.push({ pathname: '/search', query: input.trim() ? { q: input.trim() } : {} })
  }

  return (
    <>
      <Head>
        <title>{siteName} - {q ? `Search: ${q}` : 'Shop all sofas'}</title>
      </Head>
      <div className="pt-4 pb-8">
        <h1 className="text-5xl font-light mb-6">{q ? `Results for “${q}”` : 'Shop all sofas'}</h1>
        <form onSubmit={submit} role="search" className="flex items-center max-w-lg border border-gray-300 px-4 py-3 focus-within:border-gray-900">
          <FaSearch className="text-gray-400 mr-3" />
          <input
            type="search"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Search by name, colour or material"
            aria-label="Search sofas"
            className="flex-1 bg-transparent focus:outline-none"
          />
        </form>
      </div>
      <ProductBrowser products={products} facets={facets} />
    </>
  )
}

export async function getServerSideProps({ query }) {
  const q = typeof query.q === 'string' ? query.q.slice(0, 100) : ''
  const [products, facets] = await Promise.all([listProducts({ ...query, q }), listFacets()])
  return withNav({ props: { q, products, facets } })
}
