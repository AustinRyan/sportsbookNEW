import { createFileRoute } from '@tanstack/react-router'

import { requireUser } from '@/server/auth'
import { jsonRes } from '@/server/jsonRes'
import { listOpenBetsByUser } from '@/server/bets/store'

export const Route = createFileRoute('/bets/open')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authed = await requireUser(request)
        if ('error' in authed) return authed.error
        const bets = await listOpenBetsByUser(authed.user.id)
        return jsonRes({ bets })
      },
    },
  },
})

