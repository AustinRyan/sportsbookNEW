export function clampInt(n: number, min: number, max: number) {
  const x = Math.trunc(n)
  return Math.max(min, Math.min(max, x))
}

export function dollarsToCents(input: string) {
  const cleaned = input.replace(/[^0-9.]/g, '')
  if (!cleaned) return 0
  const [whole, frac = ''] = cleaned.split('.')
  const cents = Number(whole) * 100 + Number((frac + '00').slice(0, 2))
  return Number.isFinite(cents) ? clampInt(cents, 0, 10_000_000_00) : 0
}

export function formatUsdFromCents(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

// American odds:
// +150 means risk 100 to win 150 (profit).
// -150 means risk 150 to win 100 (profit).
export function calcProfitCentsFromAmericanOdds(input: {
  stakeCents: number
  americanOdds: number
}) {
  const stake = input.stakeCents
  const odds = input.americanOdds
  if (!Number.isFinite(stake) || stake <= 0) return 0
  if (!Number.isFinite(odds) || odds === 0) return 0

  if (odds > 0) {
    return Math.round((stake * odds) / 100)
  }
  return Math.round((stake * 100) / Math.abs(odds))
}


