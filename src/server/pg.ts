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
  // Make DB opt-in so local dev can't accidentally break if the environment has unrelated POSTGRES_* vars.
  // Set `USE_POSTGRES=1` to enable.
  if (!process.env.USE_POSTGRES) return false
  return Boolean(getDbUrl())
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


