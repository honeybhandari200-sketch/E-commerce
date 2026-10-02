// Loads the starter catalogue, then imports any accounts and orders left over
// from the old JSON files (data/users.json, data/orders.json). Safe to re-run:
// existing rows are never overwritten.
const fs = require('fs')
const path = require('path')
const { connect } = require('./db-client')
const { categories, products } = require('../db/seed-data')

const DATA_DIR = path.join(__dirname, '..', 'data')

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'))
  } catch (err) {
    return []
  }
}

async function seedCatalogue(client) {
  for (const [position, c] of categories.entries()) {
    await client.query(
      `INSERT INTO categories (slug, name, description, position) VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE SET name = $2, description = $3, position = $4`,
      [c.slug, c.name, c.description, position]
    )
  }

  let added = 0
  for (const [index, p] of products.entries()) {
    // Stagger created_at so "newest" sorting follows the list order.
    const { rows } = await client.query(
      `INSERT INTO products (slug, name, brand, description, price_cents, compare_at_cents, stock, image,
                             material, color, seats, width_cm, depth_cm, height_cm, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now() - make_interval(hours => $15))
       ON CONFLICT (slug) DO NOTHING
       RETURNING id`,
      [p.slug, p.name, p.brand, p.description, Math.round(p.price * 100),
       p.compareAt ? Math.round(p.compareAt * 100) : null, p.stock, p.image,
       p.material, p.color, p.seats, p.width, p.depth, p.height, index]
    )
    if (!rows.length) continue
    added++
    await client.query(
      `INSERT INTO product_categories (product_id, category_id)
       SELECT $1, id FROM categories WHERE slug = ANY($2)`,
      [rows[0].id, p.categories]
    )
  }
  console.log(`Catalogue: ${categories.length} categories, ${added} new products.`)
}

async function importLegacyUsers(client) {
  let imported = 0
  for (const u of readJson('users.json')) {
    const { rowCount } = await client.query(
      `INSERT INTO users (id, name, email, password_hash, created_at) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [u.id, u.name, u.email, u.passwordHash, u.createdAt]
    )
    imported += rowCount
  }
  if (imported) console.log(`Imported ${imported} account(s) from data/users.json.`)
}

async function importLegacyOrders(client) {
  const productIdByName = {}
  const { rows } = await client.query('SELECT id, slug, name FROM products')
  for (const row of rows) {
    productIdByName[row.name] = row.id
    const seeded = products.find(p => p.slug === row.slug)
    if (seeded && seeded.legacyName) productIdByName[seeded.legacyName] = row.id
  }

  let imported = 0
  for (const o of readJson('orders.json')) {
    const { rowCount } = await client.query(
      `INSERT INTO orders (id, user_id, email, name, address, phone, amount_cents, status,
                           card_brand, card_last4, payment_intent_id, created_at, updated_at)
       SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12
       WHERE EXISTS (SELECT 1 FROM users WHERE id = $2)
       ON CONFLICT DO NOTHING`,
      [o.id, o.userId, o.email, o.name, o.address, o.phone, o.amount, o.status,
       o.card ? o.card.brand : null, o.card ? o.card.last4 : null, o.paymentIntentId || null, o.createdAt]
    )
    if (!rowCount) continue
    imported++
    for (const item of o.items) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, name, unit_amount, quantity) VALUES ($1, $2, $3, $4, $5)',
        [o.id, productIdByName[item.name] || null, item.name, item.unitAmount, item.quantity]
      )
    }
  }
  if (imported) console.log(`Imported ${imported} order(s) from data/orders.json.`)
}

async function main() {
  const client = await connect()
  try {
    await client.query('BEGIN')
    await seedCatalogue(client)
    await importLegacyUsers(client)
    await importLegacyOrders(client)
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    await client.end()
  }
}

main().catch(err => {
  console.error(err.message)
  process.exit(1)
})
