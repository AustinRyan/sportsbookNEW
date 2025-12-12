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

type HistoryResponse = { bets: StoredBet[] }

export const Route = createFileRoute('/app/bets/history')({
  component: BetHistoryPage,
})

const col = createColumnHelper<StoredBet>()
const columns = [
  col.accessor('settledAt', {
    header: 'Settled',
    cell: (ctx) => (ctx.getValue() ? new Date(ctx.getValue()!).toLocaleString() : '—'),
  }),
  col.accessor((r) => `${r.awayTeam} @ ${r.homeTeam}`, {
    id: 'matchup',
    header: 'Event',
    cell: (ctx) => ctx.getValue(),
  }),
  col.accessor('result', {
    header: 'Result',
    cell: (ctx) => ctx.getValue() ?? '—',
  }),
  col.accessor('stakeCents', {
    header: 'Stake',
    cell: (ctx) => formatUsdFromCents(ctx.getValue()),
  }),
  col.accessor('profitCents', {
    header: 'Profit',
    cell: (ctx) =>
      ctx.getValue() == null ? '—' : formatUsdFromCents(ctx.getValue() ?? 0),
  }),
  col.accessor('payoutCents', {
    header: 'Payout',
    cell: (ctx) =>
      ctx.getValue() == null ? '—' : formatUsdFromCents(ctx.getValue() ?? 0),
  }),
]

function BetHistoryPage() {
  const history = useQuery({
    queryKey: ['bets', 'history'],
    queryFn: () => apiFetch<HistoryResponse>('/bets/history'),
  })

  const table = useReactTable({
    data: history.data?.bets ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs tracking-widest text-white/50">BETS</div>
        <h2 className="mt-1 text-2xl font-semibold">Bet history</h2>
      </div>

      {history.error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">
          {(history.error as Error).message}
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
                  {history.isLoading ? 'Loading…' : 'No settled bets yet.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

