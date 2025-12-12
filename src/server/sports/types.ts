export type SportKey = 'NFL' | 'NBA' | 'MLB' | 'UFC' | 'EPL'

export type EventStatus = 'scheduled' | 'finished'

export type EventSource = 'mock' | 'manual' | 'api'

export type MoneylineOdds = {
  home: number
  away: number
}

export type SpreadOdds = {
  homeSpread: number
  homeOdds: number
  awaySpread: number
  awayOdds: number
}

export type TotalOdds = {
  total: number
  overOdds: number
  underOdds: number
}

export type EventOdds = {
  moneyline?: MoneylineOdds
  spread?: SpreadOdds
  total?: TotalOdds
}

export type SportsEvent = {
  eventId: string
  sport: SportKey
  homeTeam: string
  awayTeam: string
  eventStartTime: string // ISO
  eventStatus: EventStatus
  source?: EventSource
  odds: EventOdds
  result?: {
    homeScore: number
    awayScore: number
    finishedAt: string // ISO
  }
}


