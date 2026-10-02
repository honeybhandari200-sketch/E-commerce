// Server-only catalogue queries. Prices are stored in cents and returned to
// pages in dollars (`price`) as well as cents (`priceCents`).
import { query, transaction } from './db'
import { slugify, isUuid } from '../utils/helpers'

const PRODUCT_COLUMNS = `
  p.id, p.slug, p.name, p.brand, p.description, p.price_cents, p.compare_at_cents, p.stock,
  p.image, p.material, p.color, p.seats, p.width_cm, p.depth_cm, p.height_cm, p.is_active, p.created_at,
  COALESCE((SELECT array_agg(c.slug ORDER BY c.position)
            FROM product_categories pc JOIN categories c ON c.id = pc.category_id
            WHERE pc.product_id = p.id), '{}') AS categories,
  (SELECT round(avg(r.rating), 1) FROM reviews r WHERE r.product_id = p.id) AS rating,
  (SELECT count(*)::int FROM reviews r WHERE r.product_id = p.id) AS review_count`

const SORTS = {
  featured: '(p.stock > 0) DESC, p.created_at DESC',
  newest: 'p.created_at DESC',
  'price-asc': 'p.price_cents ASC',
  'price-desc': 'p.price_cents DESC',
  rating: 'rating DESC NULLS LAST, review_count DESC'
}

function toProduct(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    description: row.description,
    price: row.price_cents / 100,
    priceCents: row.price_cents,
    compareAtPrice: row.compare_at_cents ? row.compare_at_cents / 100 : null,
    stock: row.stock,
    image: row.image,
    material: row.material,
    color: row.color,
    seats: row.seats,
    dimensions: { width: row.width_cm, depth: row.depth_cm, height: row.height_cm },
    categories: row.categories,
    rating: row.rating === null ? null : Number(row.rating),
    reviewCount: row.review_count,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString()
  }
}

const asList = value => (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean)
const escapeLike = text => text.replace(/[\\%_]/g, c => '\\' + c)

/* Filters come straight from the URL query, so every value is validated here. */
async function listProducts(filters = {}) {
  const where = filters.includeInactive ? [] : ['p.is_active']
  const params = []
  const param = value => {
    params.push(value)
    return `$${params.length}`
  }

  if (filters.category) {
    where.push(`EXISTS (SELECT 1 FROM product_categories pc JOIN categories c ON c.id = pc.category_id
                        WHERE pc.product_id = p.id AND c.slug = ${param(filters.category)})`)
  }
  if (filters.q && filters.q.trim()) {
    const term = param(`%${escapeLike(filters.q.trim())}%`)
    where.push(`(p.name ILIKE ${term} OR p.description ILIKE ${term} OR p.material ILIKE ${term} OR p.color ILIKE ${term})`)
  }
  const materials = asList(filters.material)
  if (materials.length) where.push(`p.material = ANY(${param(materials)})`)
  const colors = asList(filters.color)
  if (colors.length) where.push(`p.color = ANY(${param(colors)})`)
  const minPrice = Number(filters.minPrice)
  if (filters.minPrice && minPrice > 0) where.push(`p.price_cents >= ${param(Math.round(minPrice * 100))}`)
  const maxPrice = Number(filters.maxPrice)
  if (filters.maxPrice && maxPrice > 0) where.push(`p.price_cents <= ${param(Math.round(maxPrice * 100))}`)
  if (filters.inStock) where.push('p.stock > 0')

  const orderBy = SORTS[filters.sort] || SORTS.featured
  const limit = Math.min(Number(filters.limit) || 200, 200)
  const { rows } = await query(
    `SELECT ${PRODUCT_COLUMNS} FROM products p
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY ${orderBy}, p.name
     LIMIT ${limit}`,
    params
  )
  return rows.map(toProduct)
}

/* Values available to filter on, limited to one category when given. */
async function listFacets(category) {
  const { rows } = await query(
    `SELECT array_agg(DISTINCT p.material) FILTER (WHERE p.material IS NOT NULL) AS materials,
            array_agg(DISTINCT p.color) FILTER (WHERE p.color IS NOT NULL) AS colors
     FROM products p
     WHERE p.is_active AND ($1::text IS NULL OR EXISTS (
       SELECT 1 FROM product_categories pc JOIN categories c ON c.id = pc.category_id
       WHERE pc.product_id = p.id AND c.slug = $1))`,
    [category || null]
  )
  return { materials: rows[0].materials || [], colors: rows[0].colors || [] }
}

async function getProductBySlug(slug, { includeInactive = false } = {}) {
  const { rows } = await query(
    `SELECT ${PRODUCT_COLUMNS} FROM products p WHERE p.slug = $1 ${includeInactive ? '' : 'AND p.is_active'}`,
    [slug]
  )
  return rows[0] ? toProduct(rows[0]) : null
}

async function getProductsByIds(ids) {
  const validIds = ids.filter(isUuid)
  if (!validIds.length) return []
  const { rows } = await query(`SELECT ${PRODUCT_COLUMNS} FROM products p WHERE p.id = ANY($1)`, [validIds])
  return rows.map(toProduct)
}

/* Other sofas sharing a category, best matches first. */
async function relatedProducts(product, limit = 4) {
  const { rows } = await query(
    `SELECT ${PRODUCT_COLUMNS}, (
       SELECT count(*) FROM product_categories a JOIN product_categories b ON a.category_id = b.category_id
       WHERE a.product_id = p.id AND b.product_id = $1) AS shared
     FROM products p
     WHERE p.is_active AND p.id <> $1
     ORDER BY shared DESC, (p.stock > 0) DESC, p.created_at DESC
     LIMIT $2`,
    [product.id, limit]
  )
  return rows.map(toProduct)
}

/* Categories with a count of their active products and a photo to show for them. */
async function listCategories() {
  const { rows } = await query(
    `SELECT c.slug, c.name, c.description,
            count(p.id)::int AS item_count,
            (array_agg(p.image ORDER BY p.created_at DESC) FILTER (WHERE p.id IS NOT NULL))[1] AS image
     FROM categories c
     LEFT JOIN product_categories pc ON pc.category_id = c.id
     LEFT JOIN products p ON p.id = pc.product_id AND p.is_active
     GROUP BY c.id
     ORDER BY c.position, c.name`
  )
  return rows.map(r => ({ slug: r.slug, name: r.name, description: r.description, itemCount: r.item_count, image: r.image }))
}

async function getCategory(slug) {
  const categories = await listCategories()
  return categories.find(c => c.slug === slug) || null
}

/* ---------- Admin ---------- */

const optionalInt = value => (value === '' || value === null || value === undefined ? null : Number(value))

/* Checks admin form input. Returns { values } or { error }. */
function validateProductInput(body = {}) {
  const name = String(body.name || '').trim()
  const price = Number(body.price)
  const compareAt = body.compareAtPrice === '' || body.compareAtPrice == null ? null : Number(body.compareAtPrice)
  const stock = Number(body.stock)
  const image = String(body.image || '').trim()
  const ints = {
    seats: optionalInt(body.seats),
    width: optionalInt(body.dimensions && body.dimensions.width),
    depth: optionalInt(body.dimensions && body.dimensions.depth),
    height: optionalInt(body.dimensions && body.dimensions.height)
  }

  if (!name) return { error: 'Name is required.' }
  if (!(price > 0)) return { error: 'Price must be greater than 0.' }
  if (compareAt !== null && !(compareAt > price)) return { error: '"Was" price must be higher than the price.' }
  if (!Number.isInteger(stock) || stock < 0) return { error: 'Stock must be a whole number, 0 or more.' }
  if (!image) return { error: 'Add a photo.' }
  for (const [field, value] of Object.entries(ints)) {
    if (value !== null && (!Number.isInteger(value) || value <= 0)) return { error: `${field} must be a positive whole number.` }
  }

  return {
    values: {
      name,
      slug: slugify(body.slug || name),
      brand: String(body.brand || '').trim(),
      description: String(body.description || '').trim(),
      priceCents: Math.round(price * 100),
      compareAtCents: compareAt === null ? null : Math.round(compareAt * 100),
      stock,
      image,
      material: String(body.material || '').trim() || null,
      color: String(body.color || '').trim() || null,
      ...ints,
      isActive: body.isActive !== false,
      categories: asList(body.categories).map(String)
    }
  }
}

function productParams(v) {
  return [v.name, v.brand, v.description, v.priceCents, v.compareAtCents, v.stock, v.image,
    v.material, v.color, v.seats, v.width, v.depth, v.height, v.isActive]
}

async function setCategories(client, productId, slugs) {
  await client.query('DELETE FROM product_categories WHERE product_id = $1', [productId])
  await client.query(
    'INSERT INTO product_categories (product_id, category_id) SELECT $1, id FROM categories WHERE slug = ANY($2)',
    [productId, slugs]
  )
}

/* Picks a slug that no other product uses: "name", "name-2", "name-3", ... */
async function uniqueSlug(client, base, excludeId = null) {
  const { rows } = await client.query(
    'SELECT slug FROM products WHERE (slug = $1 OR slug LIKE $2) AND id IS DISTINCT FROM $3',
    [base, `${escapeLike(base)}-%`, excludeId]
  )
  const taken = new Set(rows.map(r => r.slug))
  let slug = base
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`
  return slug
}

async function createProduct(values) {
  return transaction(async client => {
    const slug = await uniqueSlug(client, values.slug)
    const { rows } = await client.query(
      `INSERT INTO products (name, brand, description, price_cents, compare_at_cents, stock, image,
                             material, color, seats, width_cm, depth_cm, height_cm, is_active, slug)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id`,
      [...productParams(values), slug]
    )
    await setCategories(client, rows[0].id, values.categories)
    return rows[0].id
  })
}

async function updateProduct(id, values) {
  return transaction(async client => {
    const slug = await uniqueSlug(client, values.slug, id)
    const { rowCount } = await client.query(
      `UPDATE products SET name = $1, brand = $2, description = $3, price_cents = $4, compare_at_cents = $5,
              stock = $6, image = $7, material = $8, color = $9, seats = $10, width_cm = $11, depth_cm = $12,
              height_cm = $13, is_active = $14, slug = $15, updated_at = now()
       WHERE id = $16`,
      [...productParams(values), slug, id]
    )
    if (!rowCount) return false
    await setCategories(client, id, values.categories)
    return true
  })
}

/* Past orders keep their own copy of the name and price, so deleting is safe. */
async function deleteProduct(id) {
  const { rowCount } = await query('DELETE FROM products WHERE id = $1', [id])
  return rowCount > 0
}

export {
  listProducts,
  listFacets,
  getProductBySlug,
  getProductsByIds,
  relatedProducts,
  listCategories,
  getCategory,
  validateProductInput,
  createProduct,
  updateProduct,
  deleteProduct
}
