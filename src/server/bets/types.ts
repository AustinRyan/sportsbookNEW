import type { SportKey } from '@/server/sports/types'

export type BetMarket = 'moneyline' | 'spread' | 'total'
export type BetStatus = 'open' | 'settled'
export type BetResult = 'win' | 'loss' | 'push'

export type BetPick =
  | { kind: 'moneyline'; side: 'home' | 'away' }
  | { kind: 'spread'; side: 'home' | 'away'; line: number }
  | { kind: 'total'; side: 'over' | 'under'; line: number }

export type StoredBet = {
  id: string
  userId: string

  eventId: string
  sport: SportKey
  homeTeam: string
  awayTeam: string
  eventStartTime: string

  market: BetMarket
  pick: BetPick
  americanOdds: number

  stakeCents: number

  status: BetStatus
  result?: BetResult
  payoutCents?: number
  profitCents?: number

  placedAt: string
  settledAt?: string
}


