import { createFileRoute } from '@tanstack/react-router'

import { jsonRes } from '@/server/jsonRes'
import { requireUser } from '@/server/auth'

export const Route = createFileRoute('/account/balance')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authed = await requireUser(request)
        if ('error' in authed) return authed.error
        const { user } = authed

        return jsonRes({
          balanceCents: user.balanceCents,
          displayName: user.displayName,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
        })
      },
    },
  },
})


