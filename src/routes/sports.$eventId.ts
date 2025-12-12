import { createFileRoute } from '@tanstack/react-router'

import { jsonRes } from '@/server/jsonRes'
import { getEventById } from '@/server/sports/store'

export const Route = createFileRoute('/sports/$eventId')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const event = await getEventById(params.eventId)
        if (!event) {
          return jsonRes({ message: 'Event not found' }, { status: 404 })
        }
        return jsonRes(event, {
          headers: {
            'cache-control': 'no-store',
          },
        })
      },
    },
  },
})


