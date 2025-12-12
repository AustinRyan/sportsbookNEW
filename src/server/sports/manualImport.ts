import crypto from 'node:crypto'

import type { SportsEvent } from '@/server/sports/types'

export function parseScoresAndOddsNbaSpreads(rawText: string, now = new Date()) {
  const year = now.getFullYear()
  const monthDay = parseMonthDay(rawText)
  if (!monthDay) {
    throw new Error('Could not find date like "December 12" in pasted text.')
  }

  const { month, day } = monthDay
  const blocks = splitIntoGameBlocks(rawText)
  const events: SportsEvent[] = []

  for (const block of blocks) {
    const game = parseGameBlock(block)
    if (!game) continue

    const startIso = toEtIsoString({
      year,
      month,
      day,
      time: game.timeEt,
    })

    const eventId = stableEventId({
      sport: 'NBA',
      dateKey: `${year}-${pad2(month)}-${pad2(day)}`,
      timeKey: game.timeEt.replace(/\s+/g, ''),
      awayTeam: game.awayTeam,
      homeTeam: game.homeTeam,
    })

    const ev: SportsEvent = {
      eventId,
      sport: 'NBA',
      awayTeam: game.awayTeam,
      homeTeam: game.homeTeam,
      eventStartTime: startIso,
      eventStatus: 'scheduled',
      source: 'manual',
      odds: {
        spread: {
          awaySpread: game.awaySpread,
          homeSpread: game.homeSpread,
          awayOdds: -110,
          homeOdds: -110,
        },
      },
    }

    events.push(ev)
  }

  if (events.length === 0) {
    throw new Error('No games found in pasted text.')
  }

  return events
}

function splitIntoGameBlocks(raw: string) {
  const re = /\d{1,2}:\d{2}\s*(?:AM|PM)\s*ET/g
  const matches = [...raw.matchAll(re)]
  if (matches.length === 0) return []

  const blocks: string[] = []
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i]!.index ?? 0
    const end = i + 1 < matches.length ? (matches[i + 1]!.index ?? raw.length) : raw.length
    blocks.push(raw.slice(start, end))
  }
  return blocks
}

function parseGameBlock(block: string): null | {
  timeEt: string
  awayTeam: string
  homeTeam: string
  awaySpread: number
  homeSpread: number
} {
  const timeMatch = block.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)\s*ET)/)
  if (!timeMatch) return null
  const timeEt = timeMatch[1]!

  // Try to extract the first two “team-like” lines after the time.
  const lines = block
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const timeIdx = lines.findIndex((l) => l.includes(timeEt))
  const after = timeIdx >= 0 ? lines.slice(timeIdx + 1) : lines

  const teamLines = after.filter((l) => isLikelyTeamLine(l))
  if (teamLines.length < 2) return null
  const awayTeam = teamLines[0]!
  const homeTeam = teamLines[1]!

  // Find signed spreads like "-3.5" or "+7". This avoids pulling "7 Games" or "7:00".
  const signed = [...block.matchAll(/([+-]\d+(?:\.\d+)?)/g)]
    .map((m) => Number(m[1]))
    .filter((n) => Number.isFinite(n) && Math.abs(n) <= 30)

  if (signed.length < 2) return null
  const awaySpread = signed[0]!
  const homeSpread = signed[1]!

  // Ensure spreads are opposite-ish; if not, still keep as-is.
  return { timeEt, awayTeam, homeTeam, awaySpread, homeSpread }
}

function isLikelyTeamLine(line: string) {
  const banned = new Set([
    'RADIO',
    'SIRIUSXM',
    'TV',
    'PREVIEW',
    'TICKETS',
    'PREGAME ODDS BY',
    'FANDUEL',
  ])
  if (banned.has(line.toUpperCase())) return false
  if (line.length < 4) return false
  if (!/[a-zA-Z]/.test(line)) return false
  // Avoid location lines like "Charlotte, NC"
  if (/,\s*[A-Z]{2}\b/.test(line)) return false
  // Avoid arena names with "Center" etc by requiring at least 2 words
  const words = line.split(/\s+/).filter(Boolean)
  if (words.length < 2) return false
  return true
}

function parseMonthDay(rawText: string): null | { month: number; day: number } {
  const months: Record<string, number> = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
  }
  const m = rawText.match(
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})/i,
  )
  if (!m) return null
  const monthName = m[1]!.toLowerCase()
  const month = months[monthName]
  const day = Number(m[2])
  if (!month || !Number.isFinite(day)) return null
  return { month, day }
}

function toEtIsoString(input: {
  year: number
  month: number
  day: number
  time: string // "7:00 PM ET"
}) {
  const m = input.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*ET/i)
  if (!m) throw new Error('Invalid time format')
  let hh = Number(m[1])
  const mm = Number(m[2])
  const ap = m[3]!.toUpperCase()
  if (ap === 'PM' && hh !== 12) hh += 12
  if (ap === 'AM' && hh === 12) hh = 0

  // December = EST (-05:00). Good enough for this project.
  return `${input.year}-${pad2(input.month)}-${pad2(input.day)}T${pad2(hh)}:${pad2(mm)}:00-05:00`
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function stableEventId(input: {
  sport: 'NBA'
  dateKey: string
  timeKey: string
  awayTeam: string
  homeTeam: string
}) {
  const base = `${input.sport}|${input.dateKey}|${input.timeKey}|${input.awayTeam}|${input.homeTeam}`
  // Stable-ish but short
  const hash = crypto.createHash('sha1').update(base).digest('hex').slice(0, 10)
  return `nba-${input.dateKey.replace(/-/g, '')}-${hash}`
}


