import { createFileRoute } from '@tanstack/react-router'

import { jsonRes } from '@/server/jsonRes'
import { requireAdmin } from '@/server/auth'
import { listBets } from '@/server/bets/store'
import { listTransactions } from '@/server/transactions/store'
import type { SportKey } from '@/server/sports/types'

export const Route = createFileRoute('/admin/overview')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authed = await requireAdmin(request)
        if ('error' in authed) return authed.error

        const bets = await listBets()
        const tx = await listTransactions()

        const handleCents = sum(bets.map((b) => b.stakeCents))
        const exposureCents = sum(bets.filter((b) => b.status === 'open').map((b) => b.stakeCents))

        const payoutsCents = sum(
          tx
            .filter((t) => t.type === 'bet_settle' || t.type === 'bet_refund')
            .map((t) => t.amountCents),
        )

        const profitCents = handleCents - payoutsCents

        const settled = bets.filter((b) => b.status === 'settled')
        const wins = settled.filter((b) => b.result === 'win').length
        const losses = settled.filter((b) => b.result === 'loss').length
        const pushes = settled.filter((b) => b.result === 'push').length
        const winRate = settled.length ? wins / settled.length : 0

        const bySport = groupBy<SportKey>(bets, (b) => b.sport)
        const sportSeries = Object.entries(bySport).map(([sport, arr]) => ({
          sport,
          handleCents: sum(arr.map((b) => b.stakeCents)),
          count: arr.length,
        }))

        const byDay = new Map<string, { day: string; handleCents: number; payoutsCents: number }>()
        for (const b of bets) {
          const day = b.placedAt.slice(0, 10)
          const cur = byDay.get(day) ?? { day, handleCents: 0, payoutsCents: 0 }
          cur.handleCents += b.stakeCents
          byDay.set(day, cur)
        }
        for (const t of tx) {
          if (t.type !== 'bet_settle' && t.type !== 'bet_refund') continue
          const day = t.createdAt.slice(0, 10)
          const cur = byDay.get(day) ?? { day, handleCents: 0, payoutsCents: 0 }
          cur.payoutsCents += t.amountCents
          byDay.set(day, cur)
        }
        const daily = [...byDay.values()]
          .sort((a, b) => a.day.localeCompare(b.day))
          .map((d) => ({
            ...d,
            profitCents: d.handleCents - d.payoutsCents,
          }))

        return jsonRes({
          kpis: {
            handleCents,
            payoutsCents,
            profitCents,
            exposureCents,
            totalBets: bets.length,
            openBets: bets.filter((b) => b.status === 'open').length,
            settledBets: settled.length,
            wins,
            losses,
            pushes,
            winRate,
          },
          sportSeries,
          daily,
        })
      },
    },
  },
})

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0)
}

function groupBy<K extends string>(arr: any[], keyFn: (x: any) => K) {
  const m: Record<string, any[]> = {}
  for (const item of arr) {
    const k = keyFn(item)
    m[k] = m[k] ?? []
    m[k].push(item)
  }
  return m as Record<K, any[]>
}

