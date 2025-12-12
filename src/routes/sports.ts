import { createFileRoute } from '@tanstack/react-router'

import { jsonRes } from '@/server/jsonRes'
import { SPORTS } from '@/server/sports/mock'
import { listEvents } from '@/server/sports/store'
import type { SportKey } from '@/server/sports/types'

export const Route = createFileRoute('/sports')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const sport = url.searchParams.get('sport')?.toUpperCase() as SportKey | null

        const allowed = new Set<SportKey>(['NFL', 'NBA', 'MLB', 'UFC', 'EPL'])
        if (sport && !allowed.has(sport)) {
          return jsonRes({ message: 'Invalid sport filter' }, { status: 400 })
        }

        const events = await listEvents({ sport: sport ?? undefined })

        return jsonRes(
          {
            sports: SPORTS,
            events,
            serverTime: new Date().toISOString(),
            provider: process.env.ODDS_PROVIDER ?? 'mock',
          },
          {
            headers: {
              'cache-control': 'no-store',
            },
          },
        )
      },
    },
  },
})

