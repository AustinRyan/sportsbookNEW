export type TxType = 'bet_place' | 'bet_settle' | 'bet_refund'

export type StoredTransaction = {
  id: string
  userId: string
  type: TxType
  amountCents: number // + credits, - debits
  balanceAfterCents: number
  createdAt: string
  meta?: Record<string, unknown>
}


