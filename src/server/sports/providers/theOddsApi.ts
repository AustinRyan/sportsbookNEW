import { z } from 'zod'

import type { SportKey, SportsEvent } from '@/server/sports/types'
import { normalizeEventForStore, upsertEventsInStore } from '@/server/sports/storeInternal'

// The Odds API sport keys mapping
const SPORT_KEY_MAP: Record<SportKey, string> = {
  NFL: 'americanfootball_nfl',
  NBA: 'basketball_nba',
  MLB: 'baseball_mlb',
  UFC: 'mma_mixedmartialarts',
  EPL: 'soccer_epl',
}

const OutcomeSchema = z.object({
  name: z.string(),
  price: z.number(),
  point: z.number().optional(),
})

const MarketSchema = z.object({
  key: z.string(),
  outcomes: z.array(OutcomeSchema),
})

const BookmakerSchema = z.object({
  key: z.string().optional(),
  title: z.string().optional(),
  last_update: z.string().optional(),
  markets: z.array(MarketSchema),
})

const OddsEventSchema = z.object({
  id: z.string(),
  sport_key: z.string(),
  home_team: z.string(),
  away_team: z.string(),
  commence_time: z.string(),
  bookmakers: z.array(BookmakerSchema).optional(),
})

export async function syncTheOddsApi(input?: { sport?: SportKey }) {
  const apiKey = process.env.ODDS_API_KEY
  if (!apiKey) {
    throw new Error(
      'Missing ODDS_API_KEY. Set ODDS_PROVIDER=theoddsapi and ODDS_API_KEY=<your key> to enable real games.',
    )
  }

  const sports: SportKey[] = input?.sport ? [input.sport] : (Object.keys(SPORT_KEY_MAP) as SportKey[])

  const allEvents: SportsEvent[] = []

  for (const sport of sports) {
    const key = SPORT_KEY_MAP[sport]
    const url = new URL(`https://api.the-odds-api.com/v4/sports/${key}/odds/`)
    url.searchParams.set('regions', 'us')
    url.searchParams.set('markets', 'h2h,spreads,totals')
    url.searchParams.set('oddsFormat', 'american')
    url.searchParams.set('apiKey', apiKey)

    const res = await fetch(url.toString())
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`The Odds API error (${res.status}): ${text || res.statusText}`)
    }

    const json = OddsEventSchema.array().safeParse(await res.json())
    if (!json.success) {
      throw new Error('The Odds API returned unexpected data')
    }

    for (const raw of json.data) {
      const bookmaker = raw.bookmakers?.[0]
      const markets = bookmaker?.markets ?? []

      const h2h = markets.find((m) => m.key === 'h2h')
      const spreads = markets.find((m) => m.key === 'spreads')
      const totals = markets.find((m) => m.key === 'totals')

      const moneyline = pickMoneyline(raw.home_team, raw.away_team, h2h?.outcomes ?? [])
      const spread = pickSpread(raw.home_team, raw.away_team, spreads?.outcomes ?? [])
      const total = pickTotal(totals?.outcomes ?? [])

      const ev: SportsEvent = normalizeEventForStore({
        eventId: raw.id,
        sport,
        homeTeam: raw.home_team,
        awayTeam: raw.away_team,
        eventStartTime: raw.commence_time,
        eventStatus: 'scheduled',
        source: 'api',
        odds: {
          moneyline,
          spread,
          total,
        },
      })

      allEvents.push(ev)
    }
  }

  await upsertEventsInStore(allEvents)
}

function pickMoneyline(home: string, away: string, outcomes: Array<{ name: string; price: number }>) {
  const homeO = outcomes.find((o) => o.name === home)?.price ?? -110
  const awayO = outcomes.find((o) => o.name === away)?.price ?? -110
  return { home: homeO, away: awayO }
}

function pickSpread(
  home: string,
  away: string,
  outcomes: Array<{ name: string; price: number; point?: number }>,
) {
  const homeO = outcomes.find((o) => o.name === home)
  const awayO = outcomes.find((o) => o.name === away)

  const homeSpread = typeof homeO?.point === 'number' ? homeO.point : -1.5
  const awaySpread = typeof awayO?.point === 'number' ? awayO.point : +1.5

  return {
    homeSpread,
    homeOdds: homeO?.price ?? -110,
    awaySpread,
    awayOdds: awayO?.price ?? -110,
  }
}

function pickTotal(outcomes: Array<{ name: string; price: number; point?: number }>) {
  const over = outcomes.find((o) => o.name.toLowerCase() === 'over')
  const under = outcomes.find((o) => o.name.toLowerCase() === 'under')
  const total = typeof over?.point === 'number' ? over.point : typeof under?.point === 'number' ? under.point : 0

  return {
    total,
    overOdds: over?.price ?? -110,
    underOdds: under?.price ?? -110,
  }
}


