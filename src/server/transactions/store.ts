import crypto from 'node:crypto'

import { readJsonFile, writeJsonFile } from '@/server/jsonDb'
import type { StoredTransaction, TxType } from '@/server/transactions/types'

const TX_FILE = 'transactions.json'

export async function listTransactions() {
  return await readJsonFile<StoredTransaction[]>(TX_FILE, [])
}

export async function listTransactionsByUser(userId: string) {
  const all = await listTransactions()
  return all.filter((t) => t.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function addTransaction(input: {
  userId: string
  type: TxType
  amountCents: number
  balanceAfterCents: number
  meta?: Record<string, unknown>
}) {
  const all = await listTransactions()
  const tx: StoredTransaction = {
    id: crypto.randomUUID(),
    userId: input.userId,
    type: input.type,
    amountCents: input.amountCents,
    balanceAfterCents: input.balanceAfterCents,
    createdAt: new Date().toISOString(),
    meta: input.meta,
  }
  all.push(tx)
  await writeJsonFile(TX_FILE, all)
  return tx
}


