import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import ProductCard from './ProductCard'
import { SORT_OPTIONS } from '../utils/catalog'

const asList = value => (Array.isArray(value) ? value : value ? [value] : [])

const FilterGroup = ({ title, children }) => (
  <div className="mb-6">
    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">{title}</p>
    {children}
  </div>
)

/* Product grid with sort and filters. Filters live in the URL query, so the
   page's getServerSideProps does the filtering and results can be shared. */
export default function ProductBrowser({ products, facets }) {
  const router = useRouter()
  const { query } = router
  const [price, setPrice] = useState({ minPrice: query.minPrice || '', maxPrice: query.maxPrice || '' })

  useEffect(() => {
    setPrice({ minPrice: query.minPrice || '', maxPrice: query.maxPrice || '' })
  }, [query.minPrice, query.maxPrice])

  function update(changes) {
    const next = { ...query, ...changes }
    Object.keys(next).forEach(key => {
      if (next[key] === '' || next[key] === undefined || (Array.isArray(next[key]) && !next[key].length)) delete next[key]
    })
    router.push({ pathname: router.pathname, query: next }, undefined, { scroll: false })
  }

  function toggle(key, value) {
    const current = asList(query[key])
    update({ [key]: current.includes(value) ? current.filter(v => v !== value) : [...current, value] })
  }

  const filterKeys = ['material', 'color', 'minPrice', 'maxPrice', 'inStock']
  const hasFilters = filterKeys.some(key => query[key])
  const checkbox = (key, value) => (
    <label key={value} className="flex items-center py-1 text-sm cursor-pointer">
      <input type="checkbox" className="mr-2" checked={asList(query[key]).includes(value)} onChange={() => toggle(key, value)} />
      {value}
    </label>
  )

  return (
    <div className="flex flex-col md:flex-row">
      <aside className="md:w-56 md:mr-10 mb-8 md:mb-0 flex-shrink-0">
        <FilterGroup title="Sort by">
          <select
            value={query.sort || 'featured'}
            onChange={e => update({ sort: e.target.value === 'featured' ? '' : e.target.value })}
            className="w-full border border-gray-300 px-2 py-2 text-sm bg-white"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FilterGroup>

        <FilterGroup title="Availability">
          <label className="flex items-center py-1 text-sm cursor-pointer">
            <input type="checkbox" className="mr-2" checked={!!query.inStock} onChange={() => update({ inStock: query.inStock ? '' : '1' })} />
            In stock only
          </label>
        </FilterGroup>

        {facets.materials.length > 1 && (
          <FilterGroup title="Material">{facets.materials.map(m => checkbox('material', m))}</FilterGroup>
        )}
        {facets.colors.length > 1 && (
          <FilterGroup title="Colour">{facets.colors.map(c => checkbox('color', c))}</FilterGroup>
        )}

        <FilterGroup title="Price ($)">
          <form className="flex items-center" onSubmit={e => { e.preventDefault(); update(price) }}>
            <input
              type="number" min="0" placeholder="Min" value={price.minPrice} aria-label="Minimum price"
              onChange={e => setPrice({ ...price, minPrice: e.target.value })}
              className="w-20 border border-gray-300 px-2 py-1 text-sm"
            />
            <span className="mx-2 text-gray-400">–</span>
            <input
              type="number" min="0" placeholder="Max" value={price.maxPrice} aria-label="Maximum price"
              onChange={e => setPrice({ ...price, maxPrice: e.target.value })}
              className="w-20 border border-gray-300 px-2 py-1 text-sm"
            />
            <button type="submit" className="ml-2 px-2 py-1 text-sm border border-gray-900 hover:bg-gray-900 hover:text-white">Go</button>
          </form>
        </FilterGroup>

        {hasFilters && (
          <button
            onClick={() => update(Object.fromEntries(filterKeys.map(key => [key, ''])))}
            className="text-sm underline text-gray-600 hover:text-gray-900 focus:outline-none"
          >
            Clear filters
          </button>
        )}
      </aside>

      <div className="flex-1">
        <p className="mb-4 text-sm text-gray-600">{products.length} {products.length === 1 ? 'sofa' : 'sofas'}</p>
        {products.length === 0 ? (
          <div className="py-16 text-center bg-light">
            <p className="text-lg mb-1">No sofas match these filters.</p>
            <p className="text-sm text-gray-600">Try removing a filter or widening the price range.</p>
          </div>
        ) : (
          <div className="grid gap-x-4 gap-y-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {products.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </div>
  )
}
