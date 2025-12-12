import { readJsonFile, writeJsonFile } from '@/server/jsonDb'
import type { SportsEvent } from '@/server/sports/types'

const EVENTS_FILE = 'events.json'

export async function readEventsFromStore() {
  return await readJsonFile<SportsEvent[]>(EVENTS_FILE, [])
}

export async function writeEventsToStore(events: SportsEvent[]) {
  await writeJsonFile(EVENTS_FILE, events)
}

export function normalizeEventForStore(e: SportsEvent): SportsEvent {
  // Ensure stable shape + ISO strings
  return {
    ...e,
    eventStartTime: new Date(e.eventStartTime).toISOString(),
  }
}

export async function upsertEventsInStore(incoming: SportsEvent[]) {
  const existing = await readEventsFromStore()
  const byId = new Map(existing.map((e) => [e.eventId, e]))

  for (const inc0 of incoming) {
    const inc = normalizeEventForStore(inc0)
    const prev = byId.get(inc.eventId)

    // Keep local admin-finished results if present
    const merged: SportsEvent = prev?.eventStatus === 'finished'
      ? { ...inc, eventStatus: prev.eventStatus, result: prev.result }
      : inc

    byId.set(inc.eventId, merged)
  }

  await writeEventsToStore([...byId.values()])
}


