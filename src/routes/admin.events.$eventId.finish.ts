import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { jsonRes } from '@/server/jsonRes'
import { requireAdmin } from '@/server/auth'
import { finishEvent } from '@/server/sports/store'
import { settleEvent } from '@/server/settlement'

const Body = z.object({
  homeScore: z.number().int().min(0).max(1000),
  awayScore: z.number().int().min(0).max(1000),
})

export const Route = createFileRoute('/admin/events/$eventId/finish')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const authed = await requireAdmin(request)
        if ('error' in authed) return authed.error

        const body = Body.safeParse(await request.json().catch(() => null))
        if (!body.success) {
          return jsonRes({ message: 'Invalid scores', issues: body.error.issues }, { status: 400 })
        }

        const updatedEvent = await finishEvent({
          eventId: params.eventId,
          homeScore: body.data.homeScore,
          awayScore: body.data.awayScore,
        })

        const settlement = await settleEvent(updatedEvent.eventId)
        return jsonRes({
          event: updatedEvent,
          settlement: {
            settledCount: settlement.settledCount,
          },
        })
      },
    },
  },
})

