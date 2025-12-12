import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'

import { clearToken, getToken } from '@/app/auth/token'
import { apiFetch } from '@/app/http'
import { formatUsdFromCents } from '@/server/money'

export const Route = createFileRoute('/app')({
  ssr: false,
  beforeLoad: () => {
    const token = getToken()
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: AppLayout,
})

function AppLayout() {
  const [tick, setTick] = React.useState(0)
  const balance = useQuery({
    queryKey: ['account', 'balance'],
    queryFn: () => apiFetch<{ balanceCents: number }>('/account/balance'),
  })

  return (
    <div className="min-h-full w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="w-full px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs tracking-widest text-white/50">APP</div>
            <h1 className="text-2xl font-semibold">Sportsbook</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm tabular-nums">
              <span className="text-white/60">Balance:</span>{' '}
              <span className="text-white">
                {balance.isLoading
                  ? '…'
                  : formatUsdFromCents(balance.data?.balanceCents ?? 0)}
              </span>
            </div>
            <Link
              to="/app"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              Dashboard
            </Link>
            <button
              onClick={() => {
                clearToken()
                setTick((n) => n + 1)
                window.location.href = '/login'
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="mt-6">
          {/* tick forces rerender after logout (defensive), but route will redirect anyway */}
          <div className="hidden">{tick}</div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}


