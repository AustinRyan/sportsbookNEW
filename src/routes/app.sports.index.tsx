import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import * as React from 'react'

import { apiFetch } from '@/app/http'
import type { SportKey, SportsEvent } from '@/server/sports/types'

type SportsResponse = {
  sports: Array<{ key: SportKey; label: string }>
  events: SportsEvent[]
  serverTime: string
  provider: string
}

export const Route = createFileRoute('/app/sports/')({
  component: SportsIndexPage,
})

function SportsIndexPage() {
  const [sport, setSport] = React.useState<SportKey | 'ALL'>('ALL')
  const [showFinished, setShowFinished] = React.useState(false)

  const data = useQuery({
    queryKey: ['sports', { sport }],
    queryFn: () =>
      apiFetch<SportsResponse>(
        sport === 'ALL' ? '/sports' : `/sports?sport=${sport}`,
      ),
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs tracking-widest text-white/50">MARKETS</div>
          <h2 className="mt-1 text-2xl font-semibold">Sports & odds</h2>
          <p className="mt-1 text-sm text-white/60">
            Live odds refresh every 10s ({data.data?.provider ?? 'mock'}) •{' '}
            <span className="text-white/50">
              {data.data?.serverTime
                ? `Updated ${new Date(data.data.serverTime).toLocaleTimeString()}`
                : ''}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-white/60">Filter:</div>
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value as SportKey | 'ALL')}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
          >
            <option value="ALL">All</option>
            <option value="NFL">NFL</option>
            <option value="NBA">NBA</option>
            <option value="MLB">MLB</option>
            <option value="UFC">UFC</option>
            <option value="EPL">Premier League</option>
          </select>
          <label className="ml-2 inline-flex items-center gap-2 text-xs text-white/60 select-none">
            <input
              type="checkbox"
              checked={showFinished}
              onChange={(e) => setShowFinished(e.target.checked)}
            />
            Show finished
          </label>
        </div>
      </div>

      {data.isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/70">
          Loading…
        </div>
      ) : null}

      {data.error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">
          {(data.error as Error).message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3">
        {(data.data?.events ?? [])
          .filter((e) => (showFinished ? true : e.eventStatus === 'scheduled'))
          .map((e) => (
          <Link
            key={e.eventId}
            to="/app/sports/$eventId"
            params={{ eventId: e.eventId }}
            preload="intent"
            className={`block group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors ${
              e.eventStatus === 'finished'
                ? 'opacity-80 hover:opacity-100 hover:bg-white/[0.05]'
                : 'hover:bg-white/[0.06]'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs tracking-widest text-white/50">
                  {e.sport} • {new Date(e.eventStartTime).toLocaleString()}
                  {e.eventStatus === 'finished' ? ' • FINAL' : ''}
                </div>
                <div className="mt-2 text-lg font-semibold">
                  <span className="text-white">{e.awayTeam}</span>{' '}
                  <span className="text-white/60">@</span>{' '}
                  <span className="text-white">{e.homeTeam}</span>
                </div>
                {e.eventStatus === 'finished' && e.result ? (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
                    <span className="text-[10px] tracking-widest text-white/50">FINAL</span>
                    <span className="font-semibold tabular-nums text-white">
                      {e.awayTeam} {e.result.awayScore} — {e.homeTeam} {e.result.homeScore}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <div className="text-[10px] tracking-widest text-white/50">
                    ML
                  </div>
                  <div className="mt-1 font-semibold tabular-nums">
                    {e.odds.moneyline
                      ? `${fmtOdds(e.odds.moneyline.away)} / ${fmtOdds(
                          e.odds.moneyline.home,
                        )}`
                      : '—'}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <div className="text-[10px] tracking-widest text-white/50">
                    SPREAD
                  </div>
                  <div className="mt-1 font-semibold tabular-nums">
                    {e.odds.spread
                      ? `${fmtSpread(e.odds.spread.awaySpread)} ${fmtOdds(
                          e.odds.spread.awayOdds,
                        )}`
                      : '—'}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <div className="text-[10px] tracking-widest text-white/50">
                    TOTAL
                  </div>
                  <div className="mt-1 font-semibold tabular-nums">
                    {e.odds.total
                      ? `O ${e.odds.total.total} ${fmtOdds(e.odds.total.overOdds)}`
                      : '—'}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm text-cyan-200/0 group-hover:text-cyan-200 transition-colors">
              {e.eventStatus === 'finished' ? 'View final →' : 'View markets →'}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function fmtOdds(n: number) {
  return n > 0 ? `+${n}` : `${n}`
}

function fmtSpread(n: number) {
  return n > 0 ? `+${n}` : `${n}`
}

