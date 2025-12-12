import fs from 'node:fs'
import path from 'node:path'

import { ensureKvSchema, getPool, hasPostgres } from '@/server/pg'

const DATA_DIR = path.join(process.cwd(), '.data')

async function ensureDataDir() {
  await fs.promises.mkdir(DATA_DIR, { recursive: true })
}

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  if (hasPostgres()) {
    await ensureKvSchema()
    const pool = getPool()
    const res = await pool.query<{ value: any }>('select value from kv_store where key = $1', [
      filename,
    ])
    if (res.rowCount && res.rows[0]) return res.rows[0].value as T
    return fallback
  }

  await ensureDataDir()
  const fullPath = path.join(DATA_DIR, filename)
  try {
    const raw = await fs.promises.readFile(fullPath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  if (hasPostgres()) {
    await ensureKvSchema()
    const pool = getPool()
    await pool.query(
      `insert into kv_store (key, value) values ($1, $2::jsonb)
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [filename, JSON.stringify(data)],
    )
    return
  }

  await ensureDataDir()
  const fullPath = path.join(DATA_DIR, filename)
  await fs.promises.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8')
}


