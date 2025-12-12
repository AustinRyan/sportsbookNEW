import type { SportsEvent } from '@/server/sports/types'

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function normalizeAmericanOdds(n: number) {
  // Keep away from -99..+99 and 0 (typical "invalid" range for American odds).
  if (!Number.isFinite(n) || n === 0) return -110
  const sign = n < 0 ? -1 : 1
  let abs = Math.abs(Math.trunc(n))
  abs = Math.max(100, Math.min(abs, 500))
  return sign * abs
}

function bumpOdds(oldOdds: number, delta: number) {
  // For positive odds: +110 -> +120 when delta=+10
  // For negative odds: -110 -> -120 when delta=+10 (shorter price)
  const old = normalizeAmericanOdds(oldOdds)
  if (old > 0) return normalizeAmericanOdds(old + delta)
  return normalizeAmericanOdds(old - delta)
}

function maybeMoveHalfPoint(line: number) {
  // ~15% chance to move by 0.5
  if (Math.random() > 0.15) return line
  const dir = Math.random() > 0.5 ? 1 : -1
  return Math.round((line + 0.5 * dir) * 2) / 2
}

export function tickOdds(events: SportsEvent[]) {
  return events.map((e) => {
    if (e.eventStatus !== 'scheduled') return e
    // Only tick mock-seeded events. Manual/admin/API events should stay stable.
    const source = e.source ?? 'mock'
    if (source !== 'mock') return e
    // Only tick "full market" events. Manual imports might be spread-only and should stay stable.
    if (!e.odds.moneyline || !e.odds.spread || !e.odds.total) return e

    const mlDelta = randInt(-12, 12)
    const spreadDelta = randInt(-10, 10)
    const totalDelta = randInt(-10, 10)

    const next = {
      ...e,
      odds: {
        moneyline: e.odds.moneyline
          ? {
              away: bumpOdds(e.odds.moneyline.away, -mlDelta),
              home: bumpOdds(e.odds.moneyline.home, mlDelta),
            }
          : undefined,
        spread: e.odds.spread
          ? {
              awaySpread: maybeMoveHalfPoint(e.odds.spread.awaySpread),
              awayOdds: bumpOdds(e.odds.spread.awayOdds, spreadDelta),
              homeSpread: maybeMoveHalfPoint(e.odds.spread.homeSpread),
              homeOdds: bumpOdds(e.odds.spread.homeOdds, -spreadDelta),
            }
          : undefined,
        total: e.odds.total
          ? {
              total: maybeMoveHalfPoint(e.odds.total.total),
              overOdds: bumpOdds(e.odds.total.overOdds, totalDelta),
              underOdds: bumpOdds(e.odds.total.underOdds, -totalDelta),
            }
          : undefined,
      },
    } satisfies SportsEvent

    return next
  })
}


