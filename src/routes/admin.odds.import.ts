import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { requireAdmin } from '@/server/auth'
import { jsonRes } from '@/server/jsonRes'
import { parseScoresAndOddsNbaSpreads } from '@/server/sports/manualImport'
import { upsertEventsInStore } from '@/server/sports/storeInternal'

const Body = z.object({
  kind: z.enum(['scoresandodds_nba_spreads']),
  rawText: z.string().min(20),
})

export const Route = createFileRoute('/admin/odds/import')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authed = await requireAdmin(request)
        if ('error' in authed) return authed.error

        const body = Body.safeParse(await request.json().catch(() => null))
        if (!body.success) {
          return jsonRes({ message: 'Invalid import payload', issues: body.error.issues }, { status: 400 })
        }

        if (body.data.kind === 'scoresandodds_nba_spreads') {
          const events = parseScoresAndOddsNbaSpreads(body.data.rawText)
          await upsertEventsInStore(events)
          return jsonRes({ imported: events.length, events })
        }

        return jsonRes({ message: 'Unsupported import kind' }, { status: 400 })
      },
    },
  },
})

