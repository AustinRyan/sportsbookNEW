import crypto from 'node:crypto'

import type { EventOdds, SportKey, SportsEvent } from '@/server/sports/types'

export type ManualEventInput = {
  eventId?: string
  sport: SportKey
  awayTeam: string
  homeTeam: string
  eventStartTime: string // ISO
  odds: EventOdds
}

export function buildManualEvent(input: ManualEventInput): SportsEvent {
  const awayTeam = input.awayTeam.trim()
  const homeTeam = input.homeTeam.trim()
  const sport = input.sport
  const eventStartIso = new Date(input.eventStartTime).toISOString()

  const eventId =
    input.eventId?.trim() ||
    stableEventId({
      sport,
      startIso: eventStartIso,
      awayTeam,
      homeTeam,
    })

  const ev: SportsEvent = {
    eventId,
    sport,
    awayTeam,
    homeTeam,
    eventStartTime: eventStartIso,
    eventStatus: 'scheduled',
    source: 'manual',
    odds: input.odds,
  }

  return ev
}

function stableEventId(input: {
  sport: SportKey
  startIso: string
  awayTeam: string
  homeTeam: string
}) {
  const base = `${input.sport}|${input.startIso}|${input.awayTeam}|${input.homeTeam}`
  const hash = crypto.createHash('sha1').update(base).digest('hex').slice(0, 10)
  return `${input.sport.toLowerCase()}-${hash}`
}


