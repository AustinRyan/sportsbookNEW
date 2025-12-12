import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { jsonRes } from '@/server/jsonRes'
import { requireUser } from '@/server/auth'
import { getEventById } from '@/server/sports/store'
import { createBet } from '@/server/bets/store'
import { addTransaction } from '@/server/transactions/store'
import { updateUserBalanceCents } from '@/server/users'
import { calcProfitCentsFromAmericanOdds } from '@/server/money'

const PlaceBetBody = z.object({
  eventId: z.string().min(1),
  market: z.enum(['moneyline', 'spread', 'total']),
  side: z.enum(['home', 'away', 'over', 'under']),
  stakeCents: z.number().int().min(100).max(50_000_00),
})

export const Route = createFileRoute('/bets')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authed = await requireUser(request)
        if ('error' in authed) return authed.error
        const { user } = authed

        const body = PlaceBetBody.safeParse(await request.json().catch(() => null))
        if (!body.success) {
          return jsonRes({ message: 'Invalid bet', issues: body.error.issues }, { status: 400 })
        }

        const event = await getEventById(body.data.eventId)
        if (!event) return jsonRes({ message: 'Event not found' }, { status: 404 })
        if (event.eventStatus !== 'scheduled') {
          return jsonRes({ message: 'Event is not open for betting' }, { status: 409 })
        }

        if (user.balanceCents < body.data.stakeCents) {
          return jsonRes({ message: 'Insufficient balance' }, { status: 409 })
        }

        // Map side -> odds + pick structure
        const { market, side } = body.data
        let americanOdds: number
        let pick:
          | { kind: 'moneyline'; side: 'home' | 'away' }
          | { kind: 'spread'; side: 'home' | 'away'; line: number }
          | { kind: 'total'; side: 'over' | 'under'; line: number }

        if (market === 'moneyline') {
          if (side !== 'home' && side !== 'away') {
            return jsonRes({ message: 'Invalid side for moneyline' }, { status: 400 })
          }
          if (!event.odds.moneyline) {
            return jsonRes({ message: 'Moneyline market not available for this event' }, { status: 409 })
          }
          americanOdds = side === 'home' ? event.odds.moneyline.home : event.odds.moneyline.away
          pick = { kind: 'moneyline', side }
        } else if (market === 'spread') {
          if (side !== 'home' && side !== 'away') {
            return jsonRes({ message: 'Invalid side for spread' }, { status: 400 })
          }
          if (!event.odds.spread) {
            return jsonRes({ message: 'Spread market not available for this event' }, { status: 409 })
          }
          if (side === 'home') {
            americanOdds = event.odds.spread.homeOdds
            pick = { kind: 'spread', side, line: event.odds.spread.homeSpread }
          } else {
            americanOdds = event.odds.spread.awayOdds
            pick = { kind: 'spread', side, line: event.odds.spread.awaySpread }
          }
        } else {
          if (side !== 'over' && side !== 'under') {
            return jsonRes({ message: 'Invalid side for total' }, { status: 400 })
          }
          if (!event.odds.total) {
            return jsonRes({ message: 'Total market not available for this event' }, { status: 409 })
          }
          americanOdds = side === 'over' ? event.odds.total.overOdds : event.odds.total.underOdds
          pick = { kind: 'total', side, line: event.odds.total.total }
        }

        const newBalance = user.balanceCents - body.data.stakeCents
        await updateUserBalanceCents({ userId: user.id, balanceCents: newBalance })

        const bet = await createBet({
          userId: user.id,
          eventId: event.eventId,
          sport: event.sport,
          homeTeam: event.homeTeam,
          awayTeam: event.awayTeam,
          eventStartTime: event.eventStartTime,
          market,
          pick,
          americanOdds,
          stakeCents: body.data.stakeCents,
        })

        await addTransaction({
          userId: user.id,
          type: 'bet_place',
          amountCents: -body.data.stakeCents,
          balanceAfterCents: newBalance,
          meta: {
            betId: bet.id,
            eventId: bet.eventId,
            market,
            side,
            americanOdds,
          },
        })

        const profitCents = calcProfitCentsFromAmericanOdds({
          stakeCents: bet.stakeCents,
          americanOdds: bet.americanOdds,
        })

        return jsonRes({
          bet,
          balanceCents: newBalance,
          potentialProfitCents: profitCents,
          potentialPayoutCents: bet.stakeCents + profitCents,
        })
      },
    },
  },
})

