import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { apiFetch } from '@/app/http'
import type { StoredBet } from '@/server/bets/types'
import { formatUsdFromCents } from '@/server/money'

type OpenBetsResponse = { bets: StoredBet[] }

export const Route = createFileRoute('/app/bets/open')({
  component: OpenBetsPage,
})

const col = createColumnHelper<StoredBet>()
const columns = [
  col.accessor('placedAt', {
    header: 'Placed',
    cell: (ctx) => new Date(ctx.getValue()).toLocaleString(),
  }),
  col.accessor((r) => `${r.awayTeam} @ ${r.homeTeam}`, {
    id: 'matchup',
    header: 'Event',
    cell: (ctx) => ctx.getValue(),
  }),
  col.accessor('market', {
    header: 'Market',
    cell: (ctx) => ctx.getValue(),
  }),
  col.accessor((r) => formatPick(r), {
    id: 'pick',
    header: 'Pick',
    cell: (ctx) => ctx.getValue(),
  }),
  col.accessor('americanOdds', {
    header: 'Odds',
    cell: (ctx) => (ctx.getValue() > 0 ? `+${ctx.getValue()}` : `${ctx.getValue()}`),
  }),
  col.accessor('stakeCents', {
    header: 'Stake',
    cell: (ctx) => formatUsdFromCents(ctx.getValue()),
  }),
]

function OpenBetsPage() {
  const open = useQuery({
    queryKey: ['bets', 'open'],
    queryFn: () => apiFetch<OpenBetsResponse>('/bets/open'),
  })

  const table = useReactTable({
    data: open.data?.bets ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-xs tracking-widest text-white/50">BETS</div>
          <h2 className="mt-1 text-2xl font-semibold">Open bets</h2>
          <p className="mt-1 text-sm text-white/60">
            These are active until the event is settled by Admin.
          </p>
        </div>
      </div>

      {open.error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">
          {(open.error as Error).message}
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/20 text-white/60">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="text-left px-4 py-3 font-medium">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                {r.getVisibleCells().map((c) => (
                  <td key={c.id} className="px-4 py-3">
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-white/60" colSpan={columns.length}>
                  {open.isLoading ? 'Loading…' : 'No open bets yet.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatPick(b: StoredBet) {
  if (b.pick.kind === 'moneyline') return `${b.pick.side.toUpperCase()} ML`
  if (b.pick.kind === 'spread')
    return `${b.pick.side.toUpperCase()} ${b.pick.line > 0 ? `+${b.pick.line}` : b.pick.line}`
  return `${b.pick.side.toUpperCase()} ${b.pick.line}`
}

