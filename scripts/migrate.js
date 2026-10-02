// Applies every db/migrations/*.sql file that has not run yet, in name order.
// Creates the database first if it does not exist.
const fs = require('fs')
const path = require('path')
const { connect, databaseUrl } = require('./db-client')

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations')

async function connectCreatingDatabase() {
  const url = databaseUrl()
  try {
    return await connect(url)
  } catch (err) {
    if (err.code !== '3D000') throw err // 3D000 = database does not exist
    const target = new URL(url)
    const name = decodeURIComponent(target.pathname.slice(1))
    target.pathname = '/postgres'
    const admin = await connect(target.toString())
    await admin.query(`CREATE DATABASE "${name.replace(/"/g, '""')}"`)
    await admin.end()
    console.log(`Created database ${name}`)
    return connect(url)
  }
}

async function main() {
  const client = await connectCreatingDatabase()
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`)
    const { rows } = await client.query('SELECT name FROM schema_migrations')
    const applied = new Set(rows.map(r => r.name))
    const pending = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql') && !applied.has(f)).sort()

    for (const file of pending) {
      await client.query('BEGIN')
      try {
        await client.query(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'))
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
        await client.query('COMMIT')
        console.log(`Applied ${file}`)
      } catch (err) {
        await client.query('ROLLBACK')
        throw new Error(`Migration ${file} failed: ${err.message}`)
      }
    }
    if (!pending.length) console.log('Database is up to date.')
  } finally {
    await client.end()
  }
}

main().catch(err => {
  console.error(err.message)
  process.exit(1)
})
