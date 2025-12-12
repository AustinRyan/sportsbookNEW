import type { StoredBet } from '@/server/bets/types'
import { updateBet, listOpenBetsByEvent } from '@/server/bets/store'
import { calcProfitCentsFromAmericanOdds } from '@/server/money'
import { addTransaction } from '@/server/transactions/store'
import { findUserById, updateUserBalanceCents } from '@/server/users'
import { getEventById } from '@/server/sports/store'

export async function settleEvent(eventId: string) {
  const event = await getEventById(eventId)
  if (!event) throw new Error('Event not found')
  if (event.eventStatus !== 'finished' || !event.result) {
    throw new Error('Event is not finished')
  }

  const openBets = await listOpenBetsByEvent(eventId)
  const settled: StoredBet[] = []

  for (const bet of openBets) {
    const outcome = computeBetOutcome(bet, event.result.homeScore, event.result.awayScore)

    const profitCents =
      outcome.result === 'win'
        ? calcProfitCentsFromAmericanOdds({
            stakeCents: bet.stakeCents,
            americanOdds: bet.americanOdds,
          })
        : 0

    const payoutCents =
      outcome.result === 'win'
        ? bet.stakeCents + profitCents
        : outcome.result === 'push'
          ? bet.stakeCents
          : 0

    const updated = await updateBet(bet.id, {
      status: 'settled',
      result: outcome.result,
      profitCents,
      payoutCents,
      settledAt: new Date().toISOString(),
    })

    // Apply balance movements:
    // stake was already debited at placement, so:
    // - win: credit payout (stake + profit)
    // - push: credit stake back
    // - loss: no credit
    if (payoutCents > 0) {
      const user = await findUserById(bet.userId)
      if (!user) continue
      const newBalance = user.balanceCents + payoutCents
      await updateUserBalanceCents({ userId: user.id, balanceCents: newBalance })
      await addTransaction({
        userId: user.id,
        type: outcome.result === 'push' ? 'bet_refund' : 'bet_settle',
        amountCents: payoutCents,
        balanceAfterCents: newBalance,
        meta: {
          betId: bet.id,
          eventId: bet.eventId,
          result: outcome.result,
        },
      })
    }

    settled.push(updated)
  }

  return { event, settledCount: settled.length, settledBets: settled }
}

function computeBetOutcome(
  bet: StoredBet,
  homeScore: number,
  awayScore: number,
): { result: 'win' | 'loss' | 'push' } {
  if (bet.market === 'moneyline' && bet.pick.kind === 'moneyline') {
    if (homeScore === awayScore) return { result: 'push' }
    const winner = homeScore > awayScore ? 'home' : 'away'
    return { result: winner === bet.pick.side ? 'win' : 'loss' }
  }

  if (bet.market === 'spread' && bet.pick.kind === 'spread') {
    const { side, line } = bet.pick
    const adjustedHome = homeScore + (side === 'home' ? line : 0)
    const adjustedAway = awayScore + (side === 'away' ? line : 0)
    if (adjustedHome === adjustedAway) return { result: 'push' }
    const winner = adjustedHome > adjustedAway ? 'home' : 'away'
    return { result: winner === side ? 'win' : 'loss' }
  }

  if (bet.market === 'total' && bet.pick.kind === 'total') {
    const total = homeScore + awayScore
    if (total === bet.pick.line) return { result: 'push' }
    const winner = total > bet.pick.line ? 'over' : 'under'
    return { result: winner === bet.pick.side ? 'win' : 'loss' }
  }

  return { result: 'loss' }
}


