import type { SportKey, SportsEvent } from '@/server/sports/types'
import { MOCK_EVENTS } from '@/server/sports/mock'
import { tickOdds } from '@/server/sports/oddsTick'
import { readEventsFromStore, upsertEventsInStore, writeEventsToStore } from '@/server/sports/storeInternal'
import { syncTheOddsApi } from '@/server/sports/providers/theOddsApi'
import { buildMinimalSeedEvents } from '@/server/sports/seed'
import { hasPostgres } from '@/server/pg'

const ODDS_TICK_MS = 10_000
let lastTickAt = 0
let lastExternalSyncAt = 0
const EXTERNAL_SYNC_MS = 10_000

async function ensureSeeded() {
  const existing = await readEventsFromStore()
  if (existing && Array.isArray(existing) && existing.length > 0) return existing

  const seedMode = (process.env.SEED_MODE ?? '').toLowerCase()

  // Defaults:
  // - Local dev (no Postgres): seed mock events
  // - Vercel + Postgres: seed a single test event (you can add real games via Admin)
  const mode =
    seedMode === 'none' || seedMode === 'minimal' || seedMode === 'mock'
      ? seedMode
      : hasPostgres()
        ? 'minimal'
        : 'mock'

  if (mode === 'none') return []

  const seed = mode === 'minimal' ? buildMinimalSeedEvents() : MOCK_EVENTS
  await writeEventsToStore(seed)
  return seed
}

async function maybeTickOdds() {
  if ((process.env.ODDS_PROVIDER ?? 'mock') !== 'mock') return
  const now = Date.now()
  if (now - lastTickAt < ODDS_TICK_MS) return
  lastTickAt = now
  const events = await ensureSeeded()
  const next = tickOdds(events)
  await writeEventsToStore(next)
}

async function maybeExternalSync(input?: { sport?: SportKey }) {
  if ((process.env.ODDS_PROVIDER ?? 'mock') !== 'theoddsapi') return
  const now = Date.now()
  if (now - lastExternalSyncAt < EXTERNAL_SYNC_MS) return
  lastExternalSyncAt = now
  await ensureSeeded()
  await syncTheOddsApi(input)
}

export async function listEvents(input?: { sport?: SportKey }) {
  await maybeExternalSync(input)
  await maybeTickOdds()
  const events = await ensureSeeded()
  if (!input?.sport) return events
  return events.filter((e) => e.sport === input.sport)
}

export async function getEventById(eventId: string) {
  await maybeExternalSync()
  await maybeTickOdds()
  const events = await ensureSeeded()
  return events.find((e) => e.eventId === eventId) ?? null
}

export async function finishEvent(input: {
  eventId: string
  homeScore: number
  awayScore: number
}) {
  const events = await ensureSeeded()
  const idx = events.findIndex((e) => e.eventId === input.eventId)
  if (idx === -1) throw new Error('Event not found')

  const updated = {
    ...events[idx],
    eventStatus: 'finished' as const,
    result: {
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      finishedAt: new Date().toISOString(),
    },
  }

  const next = [...events]
  next[idx] = updated
  await writeEventsToStore(next)
  return updated
}

export async function upsertEvent(input: SportsEvent) {
  await ensureSeeded()
  await upsertEventsInStore([input])
  const updated = await getEventById(input.eventId)
  if (!updated) throw new Error('Failed to upsert event')
  return updated
}


