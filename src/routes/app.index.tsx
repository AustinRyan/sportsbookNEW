import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { apiFetch } from '@/app/http'
import type { StoredBet } from '@/server/bets/types'
import { formatUsdFromCents } from '@/server/money'

type BalanceResponse = {
  balanceCents: number
  displayName: string
  email: string
  firstName: string
  lastName: string
  isAdmin: boolean
}

export const Route = createFileRoute('/app/')({
  component: DashboardPage,
})

type OpenBetsResponse = { bets: StoredBet[] }
type HistoryResponse = { bets: StoredBet[] }

function DashboardPage() {
  const balance = useQuery({
    queryKey: ['account', 'balance'],
    queryFn: () => apiFetch<BalanceResponse>('/account/balance'),
  })

  const open = useQuery({
    queryKey: ['bets', 'open'],
    queryFn: () => apiFetch<OpenBetsResponse>('/bets/open'),
  })

  const history = useQuery({
    queryKey: ['bets', 'history'],
    queryFn: () => apiFetch<HistoryResponse>('/bets/history'),
  })

  const stats = computeUserStats({
    openBets: open.data?.bets ?? [],
    settledBets: history.data?.bets ?? [],
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-xs tracking-widest text-white/50">BALANCE</div>
          <div className="mt-2 text-4xl font-semibold tabular-nums">
            {balance.isLoading
              ? '…'
              : formatUsdFromCents(balance.data?.balanceCents ?? 0)}
          </div>
          <div className="mt-2 text-sm text-white/60">
            Fake money only. This app is for demo/portfolio use.
          </div>

          {balance.error ? (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {(balance.error as Error).message}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-xs tracking-widest text-white/50">PROFILE</div>
          <div className="mt-2 text-lg font-semibold">
            {balance.data
              ? `${balance.data.firstName} ${balance.data.lastName}`.trim() ||
                balance.data.displayName
              : '—'}
          </div>
          <div className="mt-1 text-sm text-white/60">{balance.data?.email ?? '—'}</div>
          <div className="mt-3 text-xs text-white/50">
            Role: {balance.data?.isAdmin ? 'Admin' : 'User'}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard label="Open bets" value={`${stats.openCount}`} sub={formatUsdFromCents(stats.openExposureCents) + ' exposure'} />
        <StatCard label="Settled" value={`${stats.settledCount}`} sub={`${stats.wins}W • ${stats.losses}L • ${stats.pushes}P`} />
        <StatCard label="Win rate" value={stats.settledCount ? `${Math.round(stats.winRate * 100)}%` : '—'} sub="Settled bets only" />
        <StatCard label="Net P/L" value={formatUsdFromCents(stats.netProfitCents)} sub={`ROI ${stats.settledStakedCents ? `${Math.round(stats.roi * 100)}%` : '—'}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-xs tracking-widest text-white/50">OPEN BETS</div>
              <div className="mt-1 text-lg font-semibold">Recent</div>
            </div>
            <div className="text-xs text-white/50">
              {open.isLoading ? 'Loading…' : `${stats.openCount} open`}
            </div>
          </div>

          {open.error ? (
            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {(open.error as Error).message}
            </div>
          ) : null}

          <div className="mt-4 space-y-2">
            {(open.data?.bets ?? []).slice(0, 5).map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">
                    {b.awayTeam} <span className="text-white/60">@</span> {b.homeTeam}
                  </div>
                  <div className="text-sm font-semibold tabular-nums">
                    {formatUsdFromCents(b.stakeCents)}
                  </div>
                </div>
                <div className="mt-1 text-xs text-white/60">
                  {b.sport} • {b.market.toUpperCase()} • {formatPick(b)} •{' '}
                  {new Date(b.eventStartTime).toLocaleString()}
                </div>
              </div>
            ))}

            {(open.data?.bets?.length ?? 0) === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-6 text-center text-sm text-white/60">
                {open.isLoading ? 'Loading…' : 'No open bets yet.'}
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-xs tracking-widest text-white/50">PERFORMANCE</div>
              <div className="mt-1 text-lg font-semibold">By sport</div>
            </div>
            <div className="text-xs text-white/50">
              {history.isLoading ? 'Loading…' : `${stats.settledCount} settled`}
            </div>
          </div>

          {history.error ? (
            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {(history.error as Error).message}
            </div>
          ) : null}

          <div className="mt-4 space-y-2">
            {stats.bySport.map((s) => (
              <div
                key={s.sport}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
              >
                <div>
                  <div className="text-sm font-semibold">{s.sport}</div>
                  <div className="text-xs text-white/60">
                    {s.settledCount} settled • {s.wins}W/{s.losses}L/{s.pushes}P
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums">
                  {formatUsdFromCents(s.netProfitCents)}
                </div>
              </div>
            ))}

            {stats.bySport.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-6 text-center text-sm text-white/60">
                {history.isLoading ? 'Loading…' : 'No settled bets yet.'}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard(props: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[10px] tracking-widest text-white/50">{props.label}</div>
      <div className="mt-2 text-xl font-semibold tabular-nums">{props.value}</div>
      <div className="mt-1 text-xs text-white/60">{props.sub}</div>
    </div>
  )
}

function formatPick(b: StoredBet) {
  if (b.pick.kind === 'moneyline') return `${b.pick.side.toUpperCase()} ML`
  if (b.pick.kind === 'spread')
    return `${b.pick.side.toUpperCase()} ${
      b.pick.line > 0 ? `+${b.pick.line}` : b.pick.line
    }`
  return `${b.pick.side.toUpperCase()} ${b.pick.line}`
}

function computeUserStats(input: { openBets: StoredBet[]; settledBets: StoredBet[] }) {
  const openCount = input.openBets.length
  const openExposureCents = input.openBets.reduce((a, b) => a + b.stakeCents, 0)

  const settledCount = input.settledBets.length
  const wins = input.settledBets.filter((b) => b.result === 'win').length
  const losses = input.settledBets.filter((b) => b.result === 'loss').length
  const pushes = input.settledBets.filter((b) => b.result === 'push').length

  const settledStakedCents = input.settledBets.reduce((a, b) => a + b.stakeCents, 0)
  const netProfitCents = input.settledBets.reduce((a, b) => {
    const payout = b.payoutCents ?? 0
    return a + (payout - b.stakeCents)
  }, 0)

  const winRate = settledCount ? wins / settledCount : 0
  const roi = settledStakedCents ? netProfitCents / settledStakedCents : 0

  const bySportMap = new Map<
    string,
    { sport: string; settledCount: number; wins: number; losses: number; pushes: number; netProfitCents: number }
  >()

  for (const b of input.settledBets) {
    const key = b.sport
    const cur =
      bySportMap.get(key) ??
      { sport: key, settledCount: 0, wins: 0, losses: 0, pushes: 0, netProfitCents: 0 }
    cur.settledCount += 1
    if (b.result === 'win') cur.wins += 1
    if (b.result === 'loss') cur.losses += 1
    if (b.result === 'push') cur.pushes += 1
    cur.netProfitCents += (b.payoutCents ?? 0) - b.stakeCents
    bySportMap.set(key, cur)
  }

  const bySport = [...bySportMap.values()].sort(
    (a, b) => b.netProfitCents - a.netProfitCents,
  )

  return {
    openCount,
    openExposureCents,
    settledCount,
    wins,
    losses,
    pushes,
    settledStakedCents,
    netProfitCents,
    winRate,
    roi,
    bySport,
  }
}


