import { Link } from '@tanstack/react-router'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Shield,
  Sun,
  Moon,
  Menu,
  Trophy,
  ReceiptText,
  UserPlus,
  X,
} from 'lucide-react'

import { clearToken, getToken } from '@/app/auth/token'
import { apiFetch } from '@/app/http'
import { applyTheme, getStoredTheme, setStoredTheme, toggleTheme, type Theme } from '@/app/theme'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [tokenTick, setTokenTick] = useState(0)
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    setMounted(true)
    const stored = getStoredTheme()
    const next = stored ?? (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')
    setTheme(next)
    applyTheme(next)
  }, [])

  const isAuthed = mounted && Boolean(getToken())
  const me = useQuery({
    queryKey: ['account', 'balance'],
    queryFn: () =>
      apiFetch<{ isAdmin: boolean }>('/account/balance', {
        headers: { 'cache-control': 'no-store' },
      }),
    enabled: isAuthed,
  })

  return (
    <>
      <header className="p-4 flex items-center justify-between bg-[color:var(--panel)] text-[color:var(--text)] shadow-lg border-b border-[color:var(--hairline)] backdrop-blur-xl">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-white/5 rounded-xl transition-colors border border-[color:var(--hairline)] bg-[color:var(--panel2)]"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-3">
          <Link to="/" className="font-display text-lg tracking-[-0.06em]">
            Sportsbook
          </Link>
          <span className="hidden sm:inline text-xs tracking-[0.22em] uppercase text-[color:var(--muted)]">
            built by austin
          </span>
        </div>

        <button
          onClick={() => {
            const next = toggleTheme(theme)
            setTheme(next)
            setStoredTheme(next)
            applyTheme(next)
          }}
          className="beam-pill px-3 py-2 text-sm text-[color:var(--text)] hover:opacity-95"
          aria-label="Toggle theme"
        >
          <span className="inline-flex items-center gap-2">
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Night' : 'Day'}</span>
          </span>
        </button>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-[color:var(--bg2)] text-[color:var(--text)] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-r border-[color:var(--hairline)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[color:var(--hairline)]">
          <h2 className="text-xl font-bold font-display">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors border border-[color:var(--hairline)] bg-[color:var(--panel2)]"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors mb-2 border border-transparent"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-xl bg-[color:var(--panel)] transition-colors mb-2 border border-[color:var(--accent2)]',
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          <Link
            to="/app"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors mb-2 border border-transparent"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-xl bg-[color:var(--panel)] transition-colors mb-2 border border-[color:var(--accent2)]',
            }}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </Link>

          <Link
            to="/app/sports"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors mb-2 border border-transparent"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-xl bg-[color:var(--panel)] transition-colors mb-2 border border-[color:var(--accent2)]',
            }}
          >
            <Trophy size={20} />
            <span className="font-medium">Sports</span>
          </Link>

          {isAuthed && me.data?.isAdmin ? (
            <Link
              to="/app/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors mb-2 border border-transparent"
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-xl bg-[color:var(--panel)] transition-colors mb-2 border border-[color:var(--accent2)]',
              }}
            >
              <Shield size={20} />
              <span className="font-medium">Admin</span>
            </Link>
          ) : null}

          <div className="grid grid-cols-2 gap-2 mb-2">
            <Link
              to="/app/bets/open"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 p-3 rounded-lg hover:bg-gray-800 transition-colors"
              activeProps={{
                className:
                  'flex items-center justify-center gap-2 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors',
              }}
            >
              <ReceiptText size={18} />
              <span className="font-medium">Open</span>
            </Link>

            <Link
              to="/app/bets/history"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 p-3 rounded-lg hover:bg-gray-800 transition-colors"
              activeProps={{
                className:
                  'flex items-center justify-center gap-2 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors',
              }}
            >
              <ReceiptText size={18} />
              <span className="font-medium">History</span>
            </Link>
          </div>

          <div className="mb-2">
            {/* tokenTick forces re-render after logout; avoids stale UI */}
            <div className="hidden">{tokenTick}</div>

            {isAuthed ? (
              <button
                onClick={() => {
                  clearToken()
                  setTokenTick((n) => n + 1)
                  setIsOpen(false)
                  window.location.href = '/login'
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl hover:bg-white/5 transition-colors border border-[color:var(--hairline)] bg-[color:var(--panel2)]"
              >
                <LogOut size={18} />
                <span className="font-medium">Log out</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl hover:bg-white/5 transition-colors border border-[color:var(--hairline)] bg-[color:var(--panel2)]"
                  activeProps={{
                    className:
                      'flex items-center justify-center gap-2 p-3 rounded-xl bg-[color:var(--accent2)] text-[color:var(--bg)] transition-colors',
                  }}
                >
                  <LogIn size={18} />
                  <span className="font-medium">Log in</span>
                </Link>

                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl hover:bg-white/5 transition-colors border border-[color:var(--hairline)] bg-[color:var(--panel2)]"
                  activeProps={{
                    className:
                      'flex items-center justify-center gap-2 p-3 rounded-xl bg-[color:var(--accent)] text-[color:var(--bg)] transition-colors',
                  }}
                >
                  <UserPlus size={18} />
                  <span className="font-medium">Register</span>
                </Link>
              </div>
            )}
          </div>

        </nav>
      </aside>
    </>
  )
}
