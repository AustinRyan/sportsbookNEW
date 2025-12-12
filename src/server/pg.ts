import pg from 'pg'

type PgPool = import('pg').Pool

const PoolCtor = (pg as any).Pool as new (config: any) => PgPool

function getDbUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.VERCEL_POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ''
  )
}

export function hasPostgres() {
  const url = getDbUrl()
  if (!url) return false

  // Prefer explicit local control
  const flag = (process.env.USE_POSTGRES ?? '').toLowerCase()
  if (flag) return !['0', 'false', 'no', 'off'].includes(flag)

  // On Vercel, if a Postgres URL is present, use it by default to avoid EROFS writes.
  if (process.env.VERCEL) return true

  return false
}

declare global {
  // eslint-disable-next-line no-var
  var __sportsbook_pg_pool: PgPool | undefined
  // eslint-disable-next-line no-var
  var __sportsbook_pg_schema_ready: boolean | undefined
}

export function getPool() {
  if (!hasPostgres()) {
    throw new Error('Postgres is not configured (missing DATABASE_URL/POSTGRES_URL).')
  }

  if (!globalThis.__sportsbook_pg_pool) {
    globalThis.__sportsbook_pg_pool = new PoolCtor({
      connectionString: getDbUrl(),
      max: process.env.VERCEL ? 1 : 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    })
  }

  return globalThis.__sportsbook_pg_pool
}

export async function ensureKvSchema() {
  if (!hasPostgres()) return
  if (globalThis.__sportsbook_pg_schema_ready) return

  const pool = getPool()
  await pool.query(`
    create table if not exists kv_store (
      key text primary key,
      value jsonb not null,
      updated_at timestamptz not null default now()
    );
  `)

  globalThis.__sportsbook_pg_schema_ready = true
}


