import type { SportKey, SportsEvent } from '@/server/sports/types'

function isoInHours(hoursFromNow: number) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString()
}

export const SPORTS: Array<{ key: SportKey; label: string }> = [
  { key: 'NFL', label: 'NFL' },
  { key: 'NBA', label: 'NBA' },
  { key: 'MLB', label: 'MLB' },
  { key: 'UFC', label: 'UFC' },
  { key: 'EPL', label: 'Premier League' },
]

export const MOCK_EVENTS: SportsEvent[] = [
  // NFL
  {
    eventId: 'nfl-001',
    sport: 'NFL',
    awayTeam: 'Kansas City Chiefs',
    homeTeam: 'Buffalo Bills',
    eventStartTime: isoInHours(18),
    eventStatus: 'scheduled',
    source: 'mock',
    odds: {
      moneyline: { away: -118, home: +102 },
      spread: { awaySpread: -1.5, awayOdds: -110, homeSpread: +1.5, homeOdds: -110 },
      total: { total: 47.5, overOdds: -108, underOdds: -112 },
    },
  },
  {
    eventId: 'nfl-002',
    sport: 'NFL',
    awayTeam: 'San Francisco 49ers',
    homeTeam: 'Dallas Cowboys',
    eventStartTime: isoInHours(30),
    eventStatus: 'scheduled',
    source: 'mock',
    odds: {
      moneyline: { away: -130, home: +110 },
      spread: { awaySpread: -2.5, awayOdds: -105, homeSpread: +2.5, homeOdds: -115 },
      total: { total: 44.5, overOdds: -110, underOdds: -110 },
    },
  },

  // NBA
  {
    eventId: 'nba-001',
    sport: 'NBA',
    awayTeam: 'Boston Celtics',
    homeTeam: 'Miami Heat',
    eventStartTime: isoInHours(10),
    eventStatus: 'scheduled',
    source: 'mock',
    odds: {
      moneyline: { away: -155, home: +130 },
      spread: { awaySpread: -3.5, awayOdds: -110, homeSpread: +3.5, homeOdds: -110 },
      total: { total: 214.5, overOdds: -112, underOdds: -108 },
    },
  },
  {
    eventId: 'nba-002',
    sport: 'NBA',
    awayTeam: 'Los Angeles Lakers',
    homeTeam: 'Golden State Warriors',
    eventStartTime: isoInHours(22),
    eventStatus: 'scheduled',
    source: 'mock',
    odds: {
      moneyline: { away: +120, home: -140 },
      spread: { awaySpread: +2.5, awayOdds: -110, homeSpread: -2.5, homeOdds: -110 },
      total: { total: 229.5, overOdds: -105, underOdds: -115 },
    },
  },

  // MLB
  {
    eventId: 'mlb-001',
    sport: 'MLB',
    awayTeam: 'New York Yankees',
    homeTeam: 'Boston Red Sox',
    eventStartTime: isoInHours(8),
    eventStatus: 'scheduled',
    source: 'mock',
    odds: {
      moneyline: { away: -125, home: +108 },
      spread: { awaySpread: -1.5, awayOdds: +145, homeSpread: +1.5, homeOdds: -165 },
      total: { total: 8.5, overOdds: -110, underOdds: -110 },
    },
  },
  {
    eventId: 'mlb-002',
    sport: 'MLB',
    awayTeam: 'Los Angeles Dodgers',
    homeTeam: 'San Diego Padres',
    eventStartTime: isoInHours(26),
    eventStatus: 'scheduled',
    source: 'mock',
    odds: {
      moneyline: { away: -135, home: +115 },
      spread: { awaySpread: -1.5, awayOdds: +135, homeSpread: +1.5, homeOdds: -155 },
      total: { total: 7.5, overOdds: -105, underOdds: -115 },
    },
  },

  // UFC
  {
    eventId: 'ufc-001',
    sport: 'UFC',
    awayTeam: 'Alex Pereira',
    homeTeam: 'Israel Adesanya',
    eventStartTime: isoInHours(40),
    eventStatus: 'scheduled',
    source: 'mock',
    odds: {
      moneyline: { away: -135, home: +115 },
      spread: { awaySpread: -0.5, awayOdds: -140, homeSpread: +0.5, homeOdds: +120 },
      total: { total: 2.5, overOdds: -110, underOdds: -110 },
    },
  },
  {
    eventId: 'ufc-002',
    sport: 'UFC',
    awayTeam: 'Jon Jones',
    homeTeam: 'Tom Aspinall',
    eventStartTime: isoInHours(70),
    eventStatus: 'scheduled',
    source: 'mock',
    odds: {
      moneyline: { away: -160, home: +135 },
      spread: { awaySpread: -0.5, awayOdds: -150, homeSpread: +0.5, homeOdds: +125 },
      total: { total: 3.5, overOdds: +105, underOdds: -125 },
    },
  },

  // EPL
  {
    eventId: 'epl-001',
    sport: 'EPL',
    awayTeam: 'Arsenal',
    homeTeam: 'Manchester City',
    eventStartTime: isoInHours(14),
    eventStatus: 'scheduled',
    source: 'mock',
    odds: {
      moneyline: { away: +210, home: -140 },
      spread: { awaySpread: +0.5, awayOdds: -110, homeSpread: -0.5, homeOdds: -110 },
      total: { total: 2.5, overOdds: -115, underOdds: -105 },
    },
  },
  {
    eventId: 'epl-002',
    sport: 'EPL',
    awayTeam: 'Liverpool',
    homeTeam: 'Chelsea',
    eventStartTime: isoInHours(34),
    eventStatus: 'scheduled',
    source: 'mock',
    odds: {
      moneyline: { away: +120, home: +210 },
      spread: { awaySpread: 0, awayOdds: -115, homeSpread: 0, homeOdds: -105 },
      total: { total: 3, overOdds: -110, underOdds: -110 },
    },
  },
]


