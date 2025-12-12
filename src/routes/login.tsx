import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import * as React from 'react'

import { setToken } from '@/app/auth/token'
import { apiFetch } from '@/app/http'

type LoginResponse = {
  token: string
}

export const Route = createFileRoute('/login')({
  ssr: false,
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  const login = useMutation({
    mutationFn: async () => {
      return await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
    },
    onSuccess: (data) => {
      setToken(data.token)
      navigate({ to: '/app' })
    },
  })

  return (
    <main className="min-h-[calc(100vh-64px)] grid place-items-center px-6 py-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
        <h1 className="text-2xl font-semibold text-white">Log in</h1>
        <p className="mt-1 text-sm text-white/60">
          Fake-money sportsbook. No real wagering.
        </p>

        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            login.mutate()
          }}
        >
          <label className="block">
            <span className="text-xs tracking-wide text-white/70">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>

          <label className="block">
            <span className="text-xs tracking-wide text-white/70">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>

          {login.error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {(login.error as Error).message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={login.isPending}
            className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:opacity-60"
          >
            {login.isPending ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div className="mt-4 text-sm text-white/60">
          No account?{' '}
          <Link
            to="/register"
            className="text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
          >
            Create one
          </Link>
        </div>
      </div>
    </main>
  )
}


