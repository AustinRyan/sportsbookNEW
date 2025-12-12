import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import * as React from 'react'

import { setToken } from '@/app/auth/token'
import { apiFetch } from '@/app/http'

type RegisterResponse = {
  token: string
}

export const Route = createFileRoute('/register')({
  ssr: false,
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  const register = useMutation({
    mutationFn: async () => {
      return await apiFetch<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ firstName, lastName, email, password }),
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
        <h1 className="text-2xl font-semibold text-white">Create account</h1>
        <p className="mt-1 text-sm text-white/60">
          You start with <span className="text-white">$1,000</span> in fake
          money.
        </p>

        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            register.mutate()
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs tracking-wide text-white/70">
                First name
              </span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                type="text"
                autoComplete="given-name"
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
              />
            </label>

            <label className="block">
              <span className="text-xs tracking-wide text-white/70">
                Last name
              </span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                type="text"
                autoComplete="family-name"
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
              />
            </label>
          </div>

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
            <span className="text-xs tracking-wide text-white/70">
              Password
            </span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            />
            <div className="mt-1 text-xs text-white/45">
              Minimum 8 characters.
            </div>
          </label>

          {register.error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {(register.error as Error).message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={register.isPending}
            className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:opacity-60"
          >
            {register.isPending ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <div className="mt-4 text-sm text-white/60">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
          >
            Log in
          </Link>
        </div>
      </div>
    </main>
  )
}


