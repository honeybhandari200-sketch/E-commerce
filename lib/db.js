// Server-only Postgres access. Do not import from client components.
import { Pool } from 'pg'

// Reuse one pool across hot reloads in development.
function getPool() {
  if (!global.__pgPool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Add it to .env.local (see .env.example).')
    }
    global.__pgPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 })
  }
  return global.__pgPool
}

function query(text, params) {
  return getPool().query(text, params)
}

/* Runs fn(client) inside BEGIN/COMMIT, rolling back if it throws. */
async function transaction(fn) {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export { query, transaction }
