import { useState } from 'react'
import Image from '../Image'

const EMPTY = {
  name: '', brand: '', description: '', price: '', compareAtPrice: '', stock: '', image: '',
  material: '', color: '', seats: '', dimensions: { width: '', depth: '', height: '' },
  categories: [], isActive: true
}

const toForm = product => ({
  ...EMPTY,
  ...product,
  compareAtPrice: product.compareAtPrice || '',
  material: product.material || '',
  color: product.color || '',
  seats: product.seats || '',
  dimensions: {
    width: product.dimensions.width || '',
    depth: product.dimensions.depth || '',
    height: product.dimensions.height || ''
  }
})

const readAsDataUrl = file => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const inputClass = 'w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-900'

const Field = ({ label, hint, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="block mb-1 text-xs font-semibold uppercase tracking-wider text-gray-600">
      {label}{hint && <span className="ml-2 normal-case tracking-normal font-normal text-gray-400">{hint}</span>}
    </span>
    {children}
  </label>
)

/* Add or edit a sofa. `product` is null when adding. */
export default function ProductForm({ product, categories, onSaved, onCancel }) {
  const [form, setForm] = useState(product ? toForm(product) : EMPTY)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const set = changes => setForm({ ...form, ...changes })
  const bind = name => ({ value: form[name], onChange: e => set({ [name]: e.target.value }) })
  const bindDimension = name => ({
    value: form.dimensions[name],
    onChange: e => set({ dimensions: { ...form.dimensions, [name]: e.target.value } })
  })

  function toggleCategory(slug) {
    set({ categories: form.categories.includes(slug) ? form.categories.filter(c => c !== slug) : [...form.categories, slug] })
  }

  async function upload(event) {
    const file = event.target.files[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: await readAsDataUrl(file) })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Upload failed.')
      set({ image: data.url })
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch(product ? `/api/admin/products/${product.id}` : '/api/admin/products', {
      method: product ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) return setError(data.error || 'Could not save the product.')
    onSaved(data.product)
  }

  return (
    <form onSubmit={submit} className="bg-light p-6 mb-8">
      <h3 className="text-2xl mb-6">{product ? `Edit ${product.name}` : 'Add a sofa'}</h3>
      <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
        <Field label="Name"><input className={inputClass} required {...bind('name')} /></Field>
        <Field label="Brand"><input className={inputClass} {...bind('brand')} /></Field>
        <Field label="Description" className="md:col-span-2">
          <textarea className={`${inputClass} h-24`} {...bind('description')} />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Price ($)"><input className={inputClass} type="number" min="0" step="0.01" required {...bind('price')} /></Field>
          <Field label="Was ($)" hint="sale"><input className={inputClass} type="number" min="0" step="0.01" {...bind('compareAtPrice')} /></Field>
          <Field label="Stock"><input className={inputClass} type="number" min="0" step="1" required {...bind('stock')} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Material"><input className={inputClass} placeholder="Leather" {...bind('material')} /></Field>
          <Field label="Colour"><input className={inputClass} placeholder="Tan" {...bind('color')} /></Field>
          <Field label="Seats"><input className={inputClass} type="number" min="1" {...bind('seats')} /></Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Width (cm)"><input className={inputClass} type="number" min="1" {...bindDimension('width')} /></Field>
          <Field label="Depth (cm)"><input className={inputClass} type="number" min="1" {...bindDimension('depth')} /></Field>
          <Field label="Height (cm)"><input className={inputClass} type="number" min="1" {...bindDimension('height')} /></Field>
        </div>
        <div>
          <span className="block mb-1 text-xs font-semibold uppercase tracking-wider text-gray-600">Categories</span>
          <div className="flex flex-wrap">
            {categories.map(c => (
              <label key={c.slug} className="flex items-center mr-4 py-1 text-sm cursor-pointer">
                <input type="checkbox" className="mr-2" checked={form.categories.includes(c.slug)} onChange={() => toggleCategory(c.slug)} />
                {c.name}
              </label>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 flex items-start">
          <div className="w-32 h-24 mr-4 flex items-center justify-center bg-white flex-shrink-0">
            {form.image ? <Image src={form.image} alt="" className="max-h-full" /> : <span className="text-xs text-gray-400">No photo</span>}
          </div>
          <div className="flex-1">
            <Field label="Photo" hint="upload, or paste an image URL / path">
              <input className={inputClass} placeholder="/products/couch1.png" {...bind('image')} />
            </Field>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} className="mt-2 text-sm" />
            {uploading && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
          </div>
        </div>

        <label className="flex items-center text-sm cursor-pointer">
          <input type="checkbox" className="mr-2" checked={form.isActive} onChange={e => set({ isActive: e.target.checked })} />
          Visible in the shop
        </label>
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="mt-6 flex items-center">
        <button type="submit" disabled={saving || uploading} className="px-6 py-2 bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-60 focus:outline-none">
          {saving ? 'Saving…' : product ? 'Save changes' : 'Add sofa'}
        </button>
        <button type="button" onClick={onCancel} className="ml-4 text-sm underline text-gray-600">Cancel</button>
      </div>
    </form>
  )
}
