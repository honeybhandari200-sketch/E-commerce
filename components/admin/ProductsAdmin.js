import { useState } from 'react'
import Link from 'next/link'
import Image from '../Image'
import ProductForm from './ProductForm'
import { formatPrice } from '../../utils/currencyProvider'

function DeleteButton({ product, onDeleted }) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState(null)

  async function remove() {
    const res = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return setError(data.error || 'Could not delete.')
    onDeleted(product.id)
  }

  if (error) return <span className="text-xs text-red-600">{error}</span>
  return confirming ? (
    <span className="whitespace-nowrap">
      <button onClick={remove} className="text-red-600 font-semibold underline mr-2">Delete</button>
      <button onClick={() => setConfirming(false)} className="text-gray-600 underline">Keep</button>
    </span>
  ) : (
    <button onClick={() => setConfirming(true)} className="text-red-600 underline">Delete</button>
  )
}

export default function ProductsAdmin({ initialProducts, categories }) {
  const [products, setProducts] = useState(initialProducts)
  const [editing, setEditing] = useState(null) // a product, 'new', or null

  function saved(product) {
    const exists = products.some(p => p.id === product.id)
    setProducts(exists ? products.map(p => (p.id === product.id ? product : p)) : [product, ...products])
    setEditing(null)
    window.scrollTo(0, 0)
  }

  return (
    <>
      {editing ? (
        <ProductForm
          key={editing === 'new' ? 'new' : editing.id}
          product={editing === 'new' ? null : editing}
          categories={categories}
          onSaved={saved}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button
          onClick={() => setEditing('new')}
          className="mb-6 px-6 py-2 bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 focus:outline-none"
        >
          + Add a sofa
        </button>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-300 text-xs uppercase tracking-wider text-gray-600">
              <th className="py-3 pr-4">Sofa</th>
              <th className="py-3 pr-4">Categories</th>
              <th className="py-3 pr-4 text-right">Price</th>
              <th className="py-3 pr-4 text-right">Stock</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map(product => (
              <tr key={product.id} className="align-middle">
                <td className="py-3 pr-4">
                  <div className="flex items-center">
                    <div className="w-16 h-12 mr-3 flex items-center justify-center bg-light flex-shrink-0">
                      <Image src={product.image} alt="" className="max-h-full" />
                    </div>
                    {product.isActive ? (
                      <Link href={`/product/${product.slug}`}><a className="font-semibold hover:underline">{product.name}</a></Link>
                    ) : (
                      <span className="font-semibold text-gray-500">{product.name}</span>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4 text-gray-600">
                  {product.categories.map(slug => (categories.find(c => c.slug === slug) || { name: slug }).name).join(', ')}
                </td>
                <td className="py-3 pr-4 text-right whitespace-nowrap">
                  {product.compareAtPrice && <span className="mr-2 text-gray-400 line-through">{formatPrice(product.compareAtPrice)}</span>}
                  {formatPrice(product.price)}
                </td>
                <td className={`py-3 pr-4 text-right font-semibold ${product.stock === 0 ? 'text-red-600' : product.stock <= 2 ? 'text-yellow-700' : ''}`}>
                  {product.stock}
                </td>
                <td className="py-3 pr-4">
                  {product.isActive ? <span className="text-green-700">Visible</span> : <span className="text-gray-500">Hidden</span>}
                </td>
                <td className="py-3 text-right whitespace-nowrap">
                  <button onClick={() => { setEditing(product); window.scrollTo(0, 0) }} className="underline mr-4">Edit</button>
                  <DeleteButton product={product} onDeleted={id => setProducts(products.filter(p => p.id !== id))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
