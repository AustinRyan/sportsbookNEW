import { createFileRoute } from '@tanstack/react-router'

import { jsonRes } from '@/server/jsonRes'
import { requireAdmin } from '@/server/auth'
import { listBets } from '@/server/bets/store'
import { listUsers } from '@/server/users'
import type { StoredBet } from '@/server/bets/types'
import type { SportKey } from '@/server/sports/types'

export const Route = createFileRoute('/admin/bets')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authed = await requireAdmin(request)
        if ('error' in authed) return authed.error

        const url = new URL(request.url)
        const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
        const sport = url.searchParams.get('sport')?.toUpperCase() as SportKey | null
        const status = url.searchParams.get('status')?.toLowerCase() as
          | 'open'
          | 'settled'
          | null

        const users = await listUsers()
        const userById = new Map(users.map((u) => [u.id, u]))

        let bets = await listBets()
        if (sport) bets = bets.filter((b) => b.sport === sport)
        if (status) bets = bets.filter((b) => b.status === status)

        if (q) {
          bets = bets.filter((b) => {
            const u = userById.get(b.userId)
            const hay = [
              b.eventId,
              b.homeTeam,
              b.awayTeam,
              b.sport,
              b.market,
              u?.email,
              u?.firstName,
              u?.lastName,
              u?.displayName,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
            return hay.includes(q)
          })
        }

        const enriched = bets
          .sort((a, b) => b.placedAt.localeCompare(a.placedAt))
          .map((b) => toAdminBet(b, userById.get(b.userId)))

        return jsonRes({ bets: enriched })
      },
    },
  },
})

type AdminBet = StoredBet & {
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
    displayName: string
    isAdmin: boolean
  }
}

function toAdminBet(
  bet: StoredBet,
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
    displayName: string
    isAdmin: boolean
  },
): AdminBet {
  if (!user) return bet
  return {
    ...bet,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
    },
  }
}

