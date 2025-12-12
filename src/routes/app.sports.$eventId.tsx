import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'

import { apiFetch } from '@/app/http'
import type { SportsEvent } from '@/server/sports/types'
import {
  dollarsToCents,
  formatUsdFromCents,
  calcProfitCentsFromAmericanOdds,
} from '@/server/money'

export const Route = createFileRoute('/app/sports/$eventId')({
  component: EventDetailsPage,
})

function EventDetailsPage() {
  const { eventId } = Route.useParams()

  const event = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => apiFetch<SportsEvent>(`/sports/${eventId}`),
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  })

  if (event.isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/70">
        Loading…
      </div>
    )
  }

  if (event.error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">
        {(event.error as Error).message}
      </div>
    )
  }

  return <EventDetailsLoaded event={event.data} />
}

function EventDetailsLoaded(props: { event: SportsEvent }) {
  const e = props.event
  const qc = useQueryClient()
  const slipRef = React.useRef<HTMLDivElement | null>(null)
  const bettingOpen = e.eventStatus === 'scheduled'
  const [confirmation, setConfirmation] = React.useState<null | {
    title: string
    subtitle: string
    deltaCents: number
    newBalanceCents: number
  }>(null)

  const [market, setMarket] = React.useState<'moneyline' | 'spread' | 'total'>(
    'moneyline',
  )
  const [side, setSide] = React.useState<'home' | 'away' | 'over' | 'under'>(
    'away',
  )
  const [stake, setStake] = React.useState('25')

  const selectedOdds = getSelectedOdds(e, market, side)
  const stakeCents = dollarsToCents(stake)
  const potentialProfitCents =
    stakeCents > 0 && selectedOdds != null
      ? calcProfitCentsFromAmericanOdds({ stakeCents, americanOdds: selectedOdds })
      : 0
  const potentialPayoutCents = stakeCents + potentialProfitCents

  const balance = useQuery({
    queryKey: ['account', 'balance'],
    queryFn: () => apiFetch<{ balanceCents: number }>('/account/balance'),
  })

  const currentBalanceCents = balance.data?.balanceCents ?? 0
  const remainingCents = Math.max(0, currentBalanceCents - stakeCents)
  const insufficient = stakeCents > 0 && balance.data && currentBalanceCents < stakeCents

  const placeBet = useMutation({
    mutationFn: async (vars: {
      eventId: string
      market: 'moneyline' | 'spread' | 'total'
      side: 'home' | 'away' | 'over' | 'under'
      stakeCents: number
    }) => {
      return await apiFetch<{
        balanceCents: number
      }>('/bets', {
        method: 'POST',
        body: JSON.stringify({
          eventId: vars.eventId,
          market: vars.market,
          side: vars.side,
          stakeCents: vars.stakeCents,
        }),
      })
    },
    onMutate: async (vars) => {
      setConfirmation(null)
      await qc.cancelQueries({ queryKey: ['account', 'balance'] })
      const prev = qc.getQueryData<{ balanceCents: number }>(['account', 'balance'])
      if (prev) {
        qc.setQueryData<{ balanceCents: number }>(['account', 'balance'], {
          balanceCents: prev.balanceCents - vars.stakeCents,
        })
      }
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(['account', 'balance'], ctx.prev)
      }
    },
    onSuccess: async (data, vars) => {
      qc.setQueryData<{ balanceCents: number }>(['account', 'balance'], {
        balanceCents: data.balanceCents,
      })
      setConfirmation({
        title: 'Bet placed',
        subtitle: `${getPickLabel(e, vars.market, vars.side)} • ${formatUsdFromCents(
          vars.stakeCents,
        )}`,
        deltaCents: -vars.stakeCents,
        newBalanceCents: data.balanceCents,
      })
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['account', 'balance'] }),
        qc.invalidateQueries({ queryKey: ['bets', 'open'] }),
        qc.invalidateQueries({ queryKey: ['bets', 'history'] }),
      ])
    },
  })

  const pickLabel = getPickLabel(e, market, side)

  const pickAndFocusSlip = (next: {
    market: 'moneyline' | 'spread' | 'total'
    side: 'home' | 'away' | 'over' | 'under'
  }) => {
    setMarket(next.market)
    setSide(next.side)

    // On smaller screens, "pop" the slip into view automatically.
    if (typeof window !== 'undefined') {
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches
      if (!isDesktop) {
        slipRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-xs tracking-widest text-white/50">
            {e.sport} • {new Date(e.eventStartTime).toLocaleString()} •{' '}
            {e.eventStatus.toUpperCase()}
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {e.awayTeam} <span className="text-white/60">@</span> {e.homeTeam}
          </div>
          {e.eventStatus === 'finished' && e.result ? (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <div className="text-[10px] tracking-widest text-white/50">FINAL</div>
              <div className="mt-1 text-sm font-semibold text-white tabular-nums">
                {e.awayTeam} {e.result.awayScore} — {e.homeTeam} {e.result.homeScore}
              </div>
              <div className="mt-1 text-xs text-white/50">
                Betting is closed for finished events.
              </div>
            </div>
          ) : (
            <div className="mt-3 text-sm text-white/60">
              Click a line below to add it to your bet slip.
            </div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {e.odds.moneyline ? (
            <MarketCard title="Moneyline">
              <PickRow
                active={market === 'moneyline' && side === 'away'}
                disabled={!bettingOpen}
                onPick={() =>
                  pickAndFocusSlip({ market: 'moneyline', side: 'away' })
                }
                label={e.awayTeam}
                value={fmtOdds(e.odds.moneyline.away)}
              />
              <PickRow
                active={market === 'moneyline' && side === 'home'}
                disabled={!bettingOpen}
                onPick={() =>
                  pickAndFocusSlip({ market: 'moneyline', side: 'home' })
                }
                label={e.homeTeam}
                value={fmtOdds(e.odds.moneyline.home)}
              />
            </MarketCard>
          ) : (
            <MarketCard title="Moneyline">
              <div className="text-sm text-white/60">Not available for this event.</div>
            </MarketCard>
          )}

          {e.odds.spread ? (
            <MarketCard title="Spread">
              <PickRow
                active={market === 'spread' && side === 'away'}
                disabled={!bettingOpen}
                onPick={() =>
                  pickAndFocusSlip({ market: 'spread', side: 'away' })
                }
                label={e.awayTeam}
                value={`${fmtSpread(e.odds.spread.awaySpread)} ${fmtOdds(
                  e.odds.spread.awayOdds,
                )}`}
              />
              <PickRow
                active={market === 'spread' && side === 'home'}
                disabled={!bettingOpen}
                onPick={() =>
                  pickAndFocusSlip({ market: 'spread', side: 'home' })
                }
                label={e.homeTeam}
                value={`${fmtSpread(e.odds.spread.homeSpread)} ${fmtOdds(
                  e.odds.spread.homeOdds,
                )}`}
              />
            </MarketCard>
          ) : (
            <MarketCard title="Spread">
              <div className="text-sm text-white/60">Not available for this event.</div>
            </MarketCard>
          )}

          {e.odds.total ? (
            <MarketCard title="Total">
              <PickRow
                active={market === 'total' && side === 'over'}
                disabled={!bettingOpen}
                onPick={() =>
                  pickAndFocusSlip({ market: 'total', side: 'over' })
                }
                label={`Over ${e.odds.total.total}`}
                value={fmtOdds(e.odds.total.overOdds)}
              />
              <PickRow
                active={market === 'total' && side === 'under'}
                disabled={!bettingOpen}
                onPick={() =>
                  pickAndFocusSlip({ market: 'total', side: 'under' })
                }
                label={`Under ${e.odds.total.total}`}
                value={fmtOdds(e.odds.total.underOdds)}
              />
            </MarketCard>
          ) : (
            <MarketCard title="Total">
              <div className="text-sm text-white/60">Not available for this event.</div>
            </MarketCard>
          )}
        </div>
      </div>

      <aside ref={slipRef} className="lg:sticky lg:top-6 h-fit">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs tracking-widest text-white/50">BET SLIP</div>
            <div className="text-xs text-white/60 tabular-nums">
              {selectedOdds != null ? fmtOdds(selectedOdds) : '—'}
            </div>
          </div>

          {confirmation ? (
            <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-emerald-200">
                    {confirmation.title}
                  </div>
                  <div className="mt-0.5 text-xs text-emerald-100/70">
                    {confirmation.subtitle}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-white/80 tabular-nums">
                      Δ {formatUsdFromCents(confirmation.deltaCents)}
                    </span>
                    <span className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-white/80 tabular-nums">
                      New balance {formatUsdFromCents(confirmation.newBalanceCents)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmation(null)}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div className="text-[10px] tracking-widest text-white/50">
              SELECTION
            </div>
            <div className="mt-1 text-sm font-semibold text-white">
              {pickLabel}
            </div>
            <div className="mt-1 text-xs text-white/50">
              {e.awayTeam} @ {e.homeTeam}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <div className="text-[10px] tracking-widest text-white/50">
                BALANCE
              </div>
              <div className="mt-1 font-semibold tabular-nums">
                {balance.isLoading
                  ? '…'
                  : formatUsdFromCents(balance.data?.balanceCents ?? 0)}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <div className="text-[10px] tracking-widest text-white/50">
                STAKE
              </div>
              <div className="mt-1 font-semibold tabular-nums">
                {formatUsdFromCents(stakeCents)}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <div className="text-[10px] tracking-widest text-white/50">
                REMAINING
              </div>
              <div className={`mt-1 font-semibold tabular-nums ${insufficient ? 'text-red-200' : ''}`}>
                {formatUsdFromCents(remainingCents)}
              </div>
            </div>
          </div>

          <label className="block mt-4">
            <span className="text-xs tracking-wide text-white/70">Stake</span>
            <input
              value={stake}
              onChange={(ev) => setStake(ev.target.value)}
              inputMode="decimal"
              placeholder="25"
              disabled={!bettingOpen}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            />
            <div className="mt-1 text-xs text-white/45">
              Min $1.00 • Fake money
            </div>
          </label>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <div className="text-[10px] tracking-widest text-white/50">
                TO WIN
              </div>
              <div className="mt-1 font-semibold tabular-nums">
                {formatUsdFromCents(potentialProfitCents)}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <div className="text-[10px] tracking-widest text-white/50">
                PAYOUT
              </div>
              <div className="mt-1 font-semibold tabular-nums">
                {formatUsdFromCents(potentialPayoutCents)}
              </div>
            </div>
          </div>

          {placeBet.error ? (
            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {(placeBet.error as Error).message}
            </div>
          ) : null}

          <button
            disabled={
              placeBet.isPending ||
              stakeCents < 100 ||
              selectedOdds == null ||
              e.eventStatus !== 'scheduled' ||
              insufficient
            }
            onClick={() =>
              placeBet.mutate({
                eventId: e.eventId,
                market,
                side,
                stakeCents,
              })
            }
            className="mt-4 w-full rounded-xl bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:opacity-60"
          >
            {placeBet.isPending ? 'Placing bet…' : 'Place bet'}
          </button>
          {!bettingOpen ? (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/60">
              Game has ended — betting is disabled.
            </div>
          ) : null}

          <div className="mt-3 text-xs text-white/45">
            If you don’t see this panel, your screen is likely scrolled above it
            — tapping a line will bring you here.
          </div>
        </div>
      </aside>
    </div>
  )
}

function MarketCard(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="text-xs tracking-widest text-white/50">{props.title}</div>
      <div className="mt-3 space-y-2">{props.children}</div>
    </div>
  )
}

function PickRow(props: {
  label: string
  value: string
  active: boolean
  disabled?: boolean
  onPick: () => void
}) {
  return (
    <button
      onClick={props.disabled ? undefined : props.onPick}
      type="button"
      disabled={props.disabled}
      className={`w-full text-left flex items-center justify-between gap-3 rounded-xl border px-3 py-2 transition-colors ${
        props.active
          ? 'border-cyan-400/50 bg-cyan-400/10'
          : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
      } ${props.disabled ? 'opacity-50 cursor-not-allowed hover:bg-white/[0.03]' : ''}`}
    >
      <div className="text-sm text-white/80">{props.label}</div>
      <div className="text-sm font-semibold tabular-nums text-white">
        {props.value}
      </div>
    </button>
  )
}

function fmtOdds(n: number) {
  return n > 0 ? `+${n}` : `${n}`
}

function fmtSpread(n: number) {
  return n > 0 ? `+${n}` : `${n}`
}

function getSelectedOdds(
  e: SportsEvent,
  market: 'moneyline' | 'spread' | 'total',
  side: 'home' | 'away' | 'over' | 'under',
) {
  if (market === 'moneyline' && (side === 'home' || side === 'away')) {
    if (!e.odds.moneyline) return null
    return side === 'home' ? e.odds.moneyline.home : e.odds.moneyline.away
  }
  if (market === 'spread' && (side === 'home' || side === 'away')) {
    if (!e.odds.spread) return null
    return side === 'home' ? e.odds.spread.homeOdds : e.odds.spread.awayOdds
  }
  if (market === 'total' && (side === 'over' || side === 'under')) {
    if (!e.odds.total) return null
    return side === 'over' ? e.odds.total.overOdds : e.odds.total.underOdds
  }
  return null
}

function getPickLabel(
  e: SportsEvent,
  market: 'moneyline' | 'spread' | 'total',
  side: 'home' | 'away' | 'over' | 'under',
) {
  if (market === 'moneyline' && side === 'home')
    return e.odds.moneyline ? `${e.homeTeam} — Moneyline` : 'Moneyline not available'
  if (market === 'moneyline' && side === 'away')
    return e.odds.moneyline ? `${e.awayTeam} — Moneyline` : 'Moneyline not available'
  if (market === 'spread' && side === 'home')
    return e.odds.spread
      ? `${e.homeTeam} ${fmtSpread(e.odds.spread.homeSpread)} — Spread`
      : 'Spread not available'
  if (market === 'spread' && side === 'away')
    return e.odds.spread
      ? `${e.awayTeam} ${fmtSpread(e.odds.spread.awaySpread)} — Spread`
      : 'Spread not available'
  if (market === 'total' && side === 'over')
    return e.odds.total ? `Over ${e.odds.total.total} — Total` : 'Total not available'
  if (market === 'total' && side === 'under')
    return e.odds.total ? `Under ${e.odds.total.total} — Total` : 'Total not available'
  return 'Select a line'
}
