import type { SportKey, SportsEvent } from '@/server/sports/types'

export type OddsProviderId = 'mock' | 'theoddsapi'

export type SportsProvider = {
  id: OddsProviderId
  sync?: (input?: { sport?: SportKey }) => Promise<void>
  listEvents: (input?: { sport?: SportKey }) => Promise<SportsEvent[]>
  getEventById: (eventId: string) => Promise<SportsEvent | null>
}


