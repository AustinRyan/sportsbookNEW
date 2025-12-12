import crypto from 'node:crypto'

import { readJsonFile, writeJsonFile } from '@/server/jsonDb'
import type { StoredBet } from '@/server/bets/types'

const BETS_FILE = 'bets.json'

export async function listBets() {
  return await readJsonFile<StoredBet[]>(BETS_FILE, [])
}

export async function listBetsByUser(userId: string) {
  const all = await listBets()
  return all.filter((b) => b.userId === userId).sort((a, b) => b.placedAt.localeCompare(a.placedAt))
}

export async function listOpenBetsByUser(userId: string) {
  const all = await listBetsByUser(userId)
  return all.filter((b) => b.status === 'open')
}

export async function listHistoryBetsByUser(userId: string) {
  const all = await listBetsByUser(userId)
  return all.filter((b) => b.status === 'settled')
}

export async function listOpenBetsByEvent(eventId: string) {
  const all = await listBets()
  return all.filter((b) => b.eventId === eventId && b.status === 'open')
}

export async function createBet(input: Omit<StoredBet, 'id' | 'placedAt' | 'status'>) {
  const all = await listBets()
  const bet: StoredBet = {
    ...input,
    id: crypto.randomUUID(),
    placedAt: new Date().toISOString(),
    status: 'open',
  }
  all.push(bet)
  await writeJsonFile(BETS_FILE, all)
  return bet
}

export async function updateBet(betId: string, patch: Partial<StoredBet>) {
  const all = await listBets()
  const idx = all.findIndex((b) => b.id === betId)
  if (idx === -1) throw new Error('Bet not found')
  all[idx] = { ...all[idx], ...patch }
  await writeJsonFile(BETS_FILE, all)
  return all[idx]
}


