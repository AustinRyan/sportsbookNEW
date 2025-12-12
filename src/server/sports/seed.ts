import type { SportsEvent } from '@/server/sports/types'

export function buildMinimalSeedEvents(now = new Date()): SportsEvent[] {
  const start = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString()
  return [
    {
      eventId: 'test-001',
      sport: 'NBA',
      awayTeam: 'Test1 Team',
      homeTeam: 'Test2 Team',
      eventStartTime: start,
      eventStatus: 'scheduled',
      source: 'manual',
      odds: {
        moneyline: { away: -110, home: -110 },
        spread: { awaySpread: +2.5, awayOdds: -110, homeSpread: -2.5, homeOdds: -110 },
        total: { total: 214.5, overOdds: -110, underOdds: -110 },
      },
    },
  ]
}


