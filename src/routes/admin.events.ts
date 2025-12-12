import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { jsonRes } from '@/server/jsonRes'
import { requireAdmin } from '@/server/auth'
import { getEventById, listEvents, upsertEvent } from '@/server/sports/store'
import { buildManualEvent } from '@/server/sports/manualEvent'

const Body = z.object({
  eventId: z.string().min(1).optional(),
  sport: z.enum(['NFL', 'NBA', 'MLB', 'UFC', 'EPL']),
  awayTeam: z.string().min(2),
  homeTeam: z.string().min(2),
  eventStartTime: z.string().min(10),
  odds: z.object({
    moneyline: z
      .object({
        away: z.number().int().min(-10000).max(10000),
        home: z.number().int().min(-10000).max(10000),
      })
      .optional(),
    spread: z
      .object({
        awaySpread: z.number().min(-100).max(100),
        awayOdds: z.number().int().min(-10000).max(10000),
        homeSpread: z.number().min(-100).max(100),
        homeOdds: z.number().int().min(-10000).max(10000),
      })
      .optional(),
    total: z
      .object({
        total: z.number().min(0).max(500),
        overOdds: z.number().int().min(-10000).max(10000),
        underOdds: z.number().int().min(-10000).max(10000),
      })
      .optional(),
  }),
})

export const Route = createFileRoute('/admin/events')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authed = await requireAdmin(request)
        if ('error' in authed) return authed.error

        const events = await listEvents()
        return jsonRes({ events })
      },
      POST: async ({ request }) => {
        const authed = await requireAdmin(request)
        if ('error' in authed) return authed.error

        const body = Body.safeParse(await request.json().catch(() => null))
        if (!body.success) {
          return jsonRes({ message: 'Invalid event payload', issues: body.error.issues }, { status: 400 })
        }

        // Require at least one market
        if (!body.data.odds.moneyline && !body.data.odds.spread && !body.data.odds.total) {
          return jsonRes({ message: 'Select at least one market (moneyline/spread/total).' }, { status: 400 })
        }

        // Disallow editing finished events (protect settlement integrity)
        if (body.data.eventId) {
          const existing = await getEventById(body.data.eventId)
          if (existing?.eventStatus === 'finished') {
            return jsonRes({ message: 'Cannot edit a finished event.' }, { status: 409 })
          }
        }

        const event = buildManualEvent(body.data)
        const saved = await upsertEvent(event)
        return jsonRes({ event: saved })
      },
    },
  },
})

