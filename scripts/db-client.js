// Shared helper for the database scripts: loads .env.local the same way Next.js
// does, then opens a single connection.
const path = require('path')
const { loadEnvConfig } = require('@next/env')
const { Client } = require('pg')

loadEnvConfig(path.join(__dirname, '..'))

function databaseUrl() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set. Add it to .env.local (see .env.example).')
    process.exit(1)
  }
  return url
}

async function connect(url = databaseUrl()) {
  const client = new Client({ connectionString: url })
  await client.connect()
  return client
}

module.exports = { connect, databaseUrl }
