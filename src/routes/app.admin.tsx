import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { apiFetch } from '@/app/http'
import { formatUsdFromCents } from '@/server/money'
import type { SportKey, SportsEvent } from '@/server/sports/types'

type OverviewResponse = {
  kpis: {
    handleCents: number
    payoutsCents: number
    profitCents: number
    exposureCents: number
    totalBets: number
    openBets: number
    settledBets: number
    wins: number
    losses: number
    pushes: number
    winRate: number
  }
  sportSeries: Array<{ sport: string; handleCents: number; count: number }>
  daily: Array<{ day: string; handleCents: number; payoutsCents: number; profitCents: number }>
}

type AdminBetsResponse = {
  bets: Array<{
    id: string
    placedAt: string
    status: 'open' | 'settled'
    result?: 'win' | 'loss' | 'push'
    sport: SportKey
    market: string
    stakeCents: number
    americanOdds: number
    awayTeam: string
    homeTeam: string
    user?: {
      id: string
      email: string
      firstName: string
      lastName: string
      displayName: string
      isAdmin: boolean
    }
  }>
}

type AdminEventsResponse = { events: SportsEvent[] }

export const Route = createFileRoute('/app/admin')({
  ssr: false,
  component: AdminPage,
})

function AdminPage() {
  const qc = useQueryClient()
  const [q, setQ] = React.useState('')
  const [sport, setSport] = React.useState<SportKey | 'ALL'>('ALL')
  const [status, setStatus] = React.useState<'all' | 'open' | 'settled'>('all')
  const [editEventId, setEditEventId] = React.useState<string>('new')
  const [settleQ, setSettleQ] = React.useState('')
  const [settleLimit, setSettleLimit] = React.useState(12)

  const [formSport, setFormSport] = React.useState<SportKey>('NBA')
  const [formAwayTeam, setFormAwayTeam] = React.useState('')
  const [formHomeTeam, setFormHomeTeam] = React.useState('')
  const [formStart, setFormStart] = React.useState(() => toDatetimeLocalValue(new Date(Date.now() + 60 * 60 * 1000)))

  const [mlEnabled, setMlEnabled] = React.useState(true)
  const [mlAway, setMlAway] = React.useState(-110)
  const [mlHome, setMlHome] = React.useState(-110)

  const [spreadEnabled, setSpreadEnabled] = React.useState(true)
  const [spreadAwayLine, setSpreadAwayLine] = React.useState(3.5)
  const [spreadHomeLine, setSpreadHomeLine] = React.useState(-3.5)
  const [spreadAwayOdds, setSpreadAwayOdds] = React.useState(-110)
  const [spreadHomeOdds, setSpreadHomeOdds] = React.useState(-110)

  const [totalEnabled, setTotalEnabled] = React.useState(false)
  const [totalLine, setTotalLine] = React.useState(214.5)
  const [totalOverOdds, setTotalOverOdds] = React.useState(-110)
  const [totalUnderOdds, setTotalUnderOdds] = React.useState(-110)

  const [saveMsg, setSaveMsg] = React.useState<string | null>(null)

  const overview = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => apiFetch<OverviewResponse>('/admin/overview'),
  })

  const bets = useQuery({
    queryKey: ['admin', 'bets', { q, sport, status }],
    queryFn: () => {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (sport !== 'ALL') params.set('sport', sport)
      if (status !== 'all') params.set('status', status)
      const suffix = params.toString() ? `?${params.toString()}` : ''
      return apiFetch<AdminBetsResponse>(`/admin/bets${suffix}`)
    },
  })

  const events = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: () => apiFetch<AdminEventsResponse>('/admin/events'),
  })

  const finishEvent = useMutation({
    mutationFn: async (input: { eventId: string; homeScore: number; awayScore: number }) => {
      return await apiFetch(`/admin/events/${input.eventId}/finish`, {
        method: 'POST',
        body: JSON.stringify({ homeScore: input.homeScore, awayScore: input.awayScore }),
      })
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'overview'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'bets'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'events'] }),
        qc.invalidateQueries({ queryKey: ['account', 'balance'] }),
        qc.invalidateQueries({ queryKey: ['bets', 'open'] }),
        qc.invalidateQueries({ queryKey: ['bets', 'history'] }),
      ])
    },
  })

  const saveEvent = useMutation({
    mutationFn: async () => {
      setSaveMsg(null)
      const eventStartTime = new Date(formStart).toISOString()

      const odds: any = {}
      if (mlEnabled) odds.moneyline = { away: mlAway, home: mlHome }
      if (spreadEnabled)
        odds.spread = {
          awaySpread: spreadAwayLine,
          awayOdds: spreadAwayOdds,
          homeSpread: spreadHomeLine,
          homeOdds: spreadHomeOdds,
        }
      if (totalEnabled)
        odds.total = { total: totalLine, overOdds: totalOverOdds, underOdds: totalUnderOdds }

      return await apiFetch<{ event: SportsEvent }>('/admin/events', {
        method: 'POST',
        body: JSON.stringify({
          eventId: editEventId === 'new' ? undefined : editEventId,
          sport: formSport,
          awayTeam: formAwayTeam,
          homeTeam: formHomeTeam,
          eventStartTime,
          odds,
        }),
      })
    },
    onSuccess: async (res) => {
      setSaveMsg(`Saved: ${res.event.awayTeam} @ ${res.event.homeTeam}`)
      setEditEventId(res.event.eventId)
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'events'] }),
        qc.invalidateQueries({ queryKey: ['sports'] }),
      ])
    },
    onError: (err) => setSaveMsg((err as Error).message),
  })

  // Populate form when selecting an existing event
  React.useEffect(() => {
    if (editEventId === 'new') {
      setFormSport('NBA')
      setFormAwayTeam('')
      setFormHomeTeam('')
      setFormStart(toDatetimeLocalValue(new Date(Date.now() + 60 * 60 * 1000)))
      setMlEnabled(true)
      setMlAway(-110)
      setMlHome(-110)
      setSpreadEnabled(true)
      setSpreadAwayLine(3.5)
      setSpreadHomeLine(-3.5)
      setSpreadAwayOdds(-110)
      setSpreadHomeOdds(-110)
      setTotalEnabled(false)
      setTotalLine(214.5)
      setTotalOverOdds(-110)
      setTotalUnderOdds(-110)
      return
    }

    const ev = (events.data?.events ?? []).find((e) => e.eventId === editEventId)
    if (!ev) return
    setFormSport(ev.sport)
    setFormAwayTeam(ev.awayTeam)
    setFormHomeTeam(ev.homeTeam)
    setFormStart(toDatetimeLocalValue(new Date(ev.eventStartTime)))

    setMlEnabled(Boolean(ev.odds.moneyline))
    setMlAway(ev.odds.moneyline?.away ?? -110)
    setMlHome(ev.odds.moneyline?.home ?? -110)

    setSpreadEnabled(Boolean(ev.odds.spread))
    setSpreadAwayLine(ev.odds.spread?.awaySpread ?? 0)
    setSpreadHomeLine(ev.odds.spread?.homeSpread ?? 0)
    setSpreadAwayOdds(ev.odds.spread?.awayOdds ?? -110)
    setSpreadHomeOdds(ev.odds.spread?.homeOdds ?? -110)

    setTotalEnabled(Boolean(ev.odds.total))
    setTotalLine(ev.odds.total?.total ?? 0)
    setTotalOverOdds(ev.odds.total?.overOdds ?? -110)
    setTotalUnderOdds(ev.odds.total?.underOdds ?? -110)
  }, [editEventId, events.data])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs tracking-widest text-white/50">ADMIN</div>
          <h2 className="mt-1 text-2xl font-semibold">Operations dashboard</h2>
          <p className="mt-1 text-sm text-white/60">
            Fake-money analytics: handle, payouts, exposure, and user bet activity.
          </p>
        </div>
      </div>

      {overview.data ? (
        <div className="grid gap-3 md:grid-cols-4">
          <Kpi label="Handle" value={formatUsdFromCents(overview.data.kpis.handleCents)} />
          <Kpi label="Payouts" value={formatUsdFromCents(overview.data.kpis.payoutsCents)} />
          <Kpi label="House Profit" value={formatUsdFromCents(overview.data.kpis.profitCents)} />
          <Kpi label="Open Exposure" value={formatUsdFromCents(overview.data.kpis.exposureCents)} />
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Daily handle / payouts / profit">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overview.data?.daily ?? []}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10, 10, 12, 0.9)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'white',
                  }}
                  formatter={(v: any) => formatUsdFromCents(Number(v))}
                />
                <Line type="monotone" dataKey="handleCents" stroke="#22d3ee" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="payoutsCents" stroke="#a78bfa" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="profitCents" stroke="#34d399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Handle by sport">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.data?.sportSeries ?? []}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="sport" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10, 10, 12, 0.9)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'white',
                  }}
                  formatter={(v: any) => formatUsdFromCents(Number(v))}
                />
                <Bar dataKey="handleCents" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Create / edit event (questionnaire)">
        <div className="text-sm text-white/60">
          Build a game manually: pick a <span className="text-white">sport</span>, enter teams + start time, then enable and fill
          <span className="text-white"> moneyline</span>, <span className="text-white">spread</span>, and/or <span className="text-white">total</span>.
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-xs tracking-wide text-white/70">Edit existing (optional)</span>
            <select
              value={editEventId}
              onChange={(e) => setEditEventId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
            >
              <option value="new">New event…</option>
              {(events.data?.events ?? []).map((ev) => (
                <option key={ev.eventId} value={ev.eventId}>
                  {ev.sport} • {new Date(ev.eventStartTime).toLocaleString()} • {ev.awayTeam} @ {ev.homeTeam}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs tracking-wide text-white/70">Sport</span>
            <select
              value={formSport}
              onChange={(e) => setFormSport(e.target.value as SportKey)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
            >
              <option value="NFL">NFL</option>
              <option value="NBA">NBA</option>
              <option value="MLB">MLB</option>
              <option value="UFC">UFC</option>
              <option value="EPL">EPL</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs tracking-wide text-white/70">Away team</span>
            <input
              value={formAwayTeam}
              onChange={(e) => setFormAwayTeam(e.target.value)}
              placeholder="Away team"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>
          <label className="block">
            <span className="text-xs tracking-wide text-white/70">Home team</span>
            <input
              value={formHomeTeam}
              onChange={(e) => setFormHomeTeam(e.target.value)}
              placeholder="Home team"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-xs tracking-wide text-white/70">Start time (local)</span>
            <input
              type="datetime-local"
              value={formStart}
              onChange={(e) => setFormStart(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold">Moneyline</div>
              <label className="flex items-center gap-2 text-xs text-white/70">
                <input type="checkbox" checked={mlEnabled} onChange={(e) => setMlEnabled(e.target.checked)} />
                Enabled
              </label>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <NumberField label="Away odds" value={mlAway} onChange={setMlAway} disabled={!mlEnabled} />
              <NumberField label="Home odds" value={mlHome} onChange={setMlHome} disabled={!mlEnabled} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold">Spread</div>
              <label className="flex items-center gap-2 text-xs text-white/70">
                <input type="checkbox" checked={spreadEnabled} onChange={(e) => setSpreadEnabled(e.target.checked)} />
                Enabled
              </label>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <NumberField label="Away line" value={spreadAwayLine} onChange={setSpreadAwayLine} disabled={!spreadEnabled} step={0.5} />
              <NumberField label="Home line" value={spreadHomeLine} onChange={setSpreadHomeLine} disabled={!spreadEnabled} step={0.5} />
              <NumberField label="Away odds" value={spreadAwayOdds} onChange={setSpreadAwayOdds} disabled={!spreadEnabled} />
              <NumberField label="Home odds" value={spreadHomeOdds} onChange={setSpreadHomeOdds} disabled={!spreadEnabled} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold">Total (Over/Under)</div>
              <label className="flex items-center gap-2 text-xs text-white/70">
                <input type="checkbox" checked={totalEnabled} onChange={(e) => setTotalEnabled(e.target.checked)} />
                Enabled
              </label>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <NumberField label="Total line" value={totalLine} onChange={setTotalLine} disabled={!totalEnabled} step={0.5} />
              <div />
              <NumberField label="Over odds" value={totalOverOdds} onChange={setTotalOverOdds} disabled={!totalEnabled} />
              <NumberField label="Under odds" value={totalUnderOdds} onChange={setTotalUnderOdds} disabled={!totalEnabled} />
            </div>
          </div>
        </div>

        {saveMsg ? (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
            {saveMsg}
          </div>
        ) : null}

        <button
          disabled={
            saveEvent.isPending ||
            formAwayTeam.trim().length < 2 ||
            formHomeTeam.trim().length < 2 ||
            (!mlEnabled && !spreadEnabled && !totalEnabled)
          }
          onClick={() => saveEvent.mutate()}
          className="mt-3 w-full rounded-xl bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
        >
          {saveEvent.isPending ? 'Saving…' : editEventId === 'new' ? 'Create event' : 'Save changes'}
        </button>
      </Card>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <label className="block flex-1 min-w-[240px]">
            <span className="text-xs tracking-wide text-white/70">Search</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="email, name, team, eventId…"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>
          <label className="block">
            <span className="text-xs tracking-wide text-white/70">Sport</span>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
            >
              <option value="ALL">All</option>
              <option value="NFL">NFL</option>
              <option value="NBA">NBA</option>
              <option value="MLB">MLB</option>
              <option value="UFC">UFC</option>
              <option value="EPL">EPL</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs tracking-wide text-white/70">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="settled">Settled</option>
            </select>
          </label>
        </div>
      </div>

      <Card title="All bets (filtered)">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-white/60">
              <tr>
                <th className="text-left py-2 pr-4 font-medium">Placed</th>
                <th className="text-left py-2 pr-4 font-medium">User</th>
                <th className="text-left py-2 pr-4 font-medium">Event</th>
                <th className="text-left py-2 pr-4 font-medium">Sport</th>
                <th className="text-left py-2 pr-4 font-medium">Market</th>
                <th className="text-left py-2 pr-4 font-medium">Stake</th>
                <th className="text-left py-2 pr-4 font-medium">Status</th>
                <th className="text-left py-2 pr-4 font-medium">Result</th>
              </tr>
            </thead>
            <tbody className="border-t border-white/10">
              {(bets.data?.bets ?? []).map((b) => (
                <tr key={b.id} className="border-t border-white/10">
                  <td className="py-2 pr-4">{new Date(b.placedAt).toLocaleString()}</td>
                  <td className="py-2 pr-4">
                    {b.user ? (
                      <div>
                        <div className="text-white">
                          {b.user.firstName} {b.user.lastName}
                        </div>
                        <div className="text-white/50 text-xs">{b.user.email}</div>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {b.awayTeam} @ {b.homeTeam}
                  </td>
                  <td className="py-2 pr-4">{b.sport}</td>
                  <td className="py-2 pr-4">{b.market}</td>
                  <td className="py-2 pr-4">{formatUsdFromCents(b.stakeCents)}</td>
                  <td className="py-2 pr-4">{b.status}</td>
                  <td className="py-2 pr-4">{b.result ?? '—'}</td>
                </tr>
              ))}
              {(bets.data?.bets?.length ?? 0) === 0 ? (
                <tr>
                  <td className="py-8 text-white/60" colSpan={8}>
                    {bets.isLoading ? 'Loading…' : 'No bets found.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Set event outcome (settles all open bets)">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <label className="block flex-1 min-w-[260px]">
            <span className="text-xs tracking-wide text-white/70">Find event</span>
            <input
              value={settleQ}
              onChange={(e) => setSettleQ(e.target.value)}
              placeholder="team, sport, eventId…"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>
          <button
            onClick={() => setSettleLimit((n) => Math.min(n + 12, 200))}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            Show more
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(events.data?.events ?? [])
            .filter((e) => e.eventStatus === 'scheduled')
            .sort(
              (a, b) =>
                new Date(a.eventStartTime).getTime() - new Date(b.eventStartTime).getTime(),
            )
            .filter((e) => {
              const q = settleQ.trim().toLowerCase()
              if (!q) return true
              return (
                e.eventId.toLowerCase().includes(q) ||
                e.sport.toLowerCase().includes(q) ||
                e.homeTeam.toLowerCase().includes(q) ||
                e.awayTeam.toLowerCase().includes(q)
              )
            })
            .slice(0, settleLimit)
            .map((e) => (
              <SetOutcomeCard
                key={e.eventId}
                event={e}
                onFinish={(scores) =>
                  finishEvent.mutate({ eventId: e.eventId, ...scores })
                }
                isPending={finishEvent.isPending}
              />
            ))}
        </div>
        <div className="mt-3 text-xs text-white/45">
          Showing up to {settleLimit} upcoming events (sorted by start time).
        </div>
      </Card>
    </div>
  )
}

function NumberField(props: {
  label: string
  value: number
  onChange: (n: number) => void
  disabled?: boolean
  step?: number
}) {
  return (
    <label className="block">
      <span className="text-xs tracking-wide text-white/70">{props.label}</span>
      <input
        type="number"
        value={Number.isFinite(props.value) ? props.value : 0}
        step={props.step ?? 1}
        disabled={props.disabled}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none disabled:opacity-60"
      />
    </label>
  )
}

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function Kpi(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[10px] tracking-widest text-white/50">{props.label}</div>
      <div className="mt-2 text-xl font-semibold tabular-nums">{props.value}</div>
    </div>
  )
}

function Card(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs tracking-widest text-white/50">{props.title}</div>
      <div className="mt-3">{props.children}</div>
    </div>
  )
}

function SetOutcomeCard(props: {
  event: SportsEvent
  isPending: boolean
  onFinish: (scores: { homeScore: number; awayScore: number }) => void
}) {
  const [homeScore, setHomeScore] = React.useState('0')
  const [awayScore, setAwayScore] = React.useState('0')

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs tracking-widest text-white/50">
        {props.event.sport} • {new Date(props.event.eventStartTime).toLocaleString()}
      </div>
      <div className="mt-2 text-white font-semibold">
        {props.event.awayTeam} @ {props.event.homeTeam}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-xs text-white/60">Away score</span>
          <input
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            inputMode="numeric"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs text-white/60">Home score</span>
          <input
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            inputMode="numeric"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
          />
        </label>
      </div>
      <button
        disabled={props.isPending}
        onClick={() =>
          props.onFinish({
            homeScore: Number(homeScore) || 0,
            awayScore: Number(awayScore) || 0,
          })
        }
        className="mt-3 w-full rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
      >
        {props.isPending ? 'Settling…' : 'Finish event + settle bets'}
      </button>
    </div>
  )
}

