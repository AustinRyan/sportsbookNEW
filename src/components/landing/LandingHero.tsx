import { Link } from '@tanstack/react-router'
import * as React from 'react'
import { ArrowRight, Sparkles, ShieldCheck, Timer } from 'lucide-react'

import { getToken } from '@/app/auth/token'

export default function LandingHero() {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isAuthed = mounted && Boolean(getToken())

  const primaryTo = isAuthed ? '/app' : '/register'
  const secondaryTo = isAuthed ? '/app/sports' : '/login'

  return (
    <div className="relative overflow-hidden min-h-full w-full">
      <div className="hero-clip" aria-hidden="true" />

      <div className="w-full px-4 sm:px-6 py-10 sm:py-14 md:py-20">
        <div className="flex items-center justify-between gap-3">
          <div className="beam-pill px-4 py-2 text-[10px] sm:text-xs tracking-[0.22em] text-[color:var(--muted)] uppercase">
            Fake money only • Real odds logic and Instant settlement
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="text-sm text-[color:var(--muted)]">
               Build using React + TanStack • Local persistence
            </div>

            <h1 className="mt-4 text-5xl sm:text-6xl md:text-7xl font-display leading-[0.92]">
              <DropText text="Sportsbook" />
            </h1>

            <p className="mt-5 max-w-xl text-base sm:text-lg text-[color:var(--muted)] leading-relaxed">
              A fake‑money book that feels real: live-ish odds refresh, a sticky bet slip,
              and a full admin desk for outcomes + settlement.
            </p>

            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
              <Link
                to={primaryTo}
                className="beam-pill px-5 py-3 text-center justify-center text-[color:var(--bg)] font-semibold bg-[color:var(--accent)] hover:brightness-95"
              >
                <span className="inline-flex items-center gap-2">
                  {isAuthed ? 'Go to dashboard' : 'Create account'}
                  <ArrowRight size={18} />
                </span>
              </Link>

              <Link
                to={secondaryTo}
                className="beam-pill px-5 py-3 text-center justify-center text-[color:var(--text)] hover:bg-white/5"
              >
                <span className="inline-flex items-center gap-2">
                  {isAuthed ? 'Browse markets' : 'Log in'}
                  <ArrowRight size={18} />
                </span>
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <MiniKpi icon={<Sparkles size={16} />} label="Optimistic bet placement" />
              <MiniKpi icon={<Timer size={16} />} label="Odds tick (mocked)" />
              <MiniKpi icon={<ShieldCheck size={16} />} label="JWT auth + hashed pw" />
            </div>
          </div>

          <div className="relative sm:mx-auto sm:max-w-xl lg:max-w-none">
            <div className="carousel">
              <CarouselCard
                slot="1"
                title="Bet slip"
                value="Stake → to win → payout"
                detail="Sticky panel, instant confirmation, optimistic balance."
                accent="var(--accent2)"
              />
              <CarouselCard
                slot="2"
                title="Markets"
                value="ML / Spread / Total"
                detail="Partial markets supported — manual or API provider."
                accent="var(--accent)"
              />
              <CarouselCard
                slot="3"
                title="Admin desk"
                value="Finish event → settle"
                detail="KPIs, filters, and outcome settlement flows."
                accent="var(--accent3)"
              />
            </div>

            {/* Desktop marquee */}
            <div className="mt-6 marquee hidden sm:block">
              <div className="marquee-track text-xs tracking-[0.28em] uppercase text-[color:var(--muted)]">
                {[
                  'NBA',
                  'NFL',
                  'MLB',
                  'UFC',
                  'EPL',
                  'LIVE TICK',
                  'MONEYLINE',
                  'SPREAD',
                  'TOTAL',
                ]
                  .concat([
                    'NBA',
                    'NFL',
                    'MLB',
                    'UFC',
                    'EPL',
                    'LIVE TICK',
                    'MONEYLINE',
                    'SPREAD',
                    'TOTAL',
                  ])
                  .map((x, i) => (
                    <span
                      key={`${x}-${i}`}
                      className="beam-pill px-3 py-2 text-[color:var(--muted)]"
                    >
                      {x}
                    </span>
                  ))}
              </div>
            </div>

            {/* Mobile: swipe row (less CPU than continuous marquee) */}
            <div className="mt-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar sm:hidden">
              {['NBA', 'NFL', 'MLB', 'UFC', 'EPL', 'LIVE TICK', 'ML', 'SPREAD', 'TOTAL'].map((x) => (
                <span key={x} className="beam-pill px-3 py-2 text-[10px] tracking-[0.22em] uppercase text-[color:var(--muted)] whitespace-nowrap">
                  {x}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 sm:mt-14 grid gap-3 md:grid-cols-3">
          <FlashCard
            title="Live-ish odds"
            body="Server jitters odds every 10s (or swap to an official provider)."
            tag="Polling"
          />
          <FlashCard
            title="Stats that matter"
            body="Open exposure, win rate, ROI, net P/L — per sport and overall."
            tag="Dashboard"
          />
          <FlashCard
            title="Admin control"
            body="Finish events, settle bets, and watch balances update instantly."
            tag="Ops"
          />
        </div>
      </div>
    </div>
  )
}

function DropText({ text }: { text: string }) {
  const chars = React.useMemo(() => Array.from(text), [text])
  return (
    <span aria-label={text} role="text">
      {chars.map((ch, i) => {
        if (ch === ' ') return <span key={i}>&nbsp;</span>
        return (
          <span key={i} className="inline-block overflow-hidden align-baseline">
            <span className="drop-char" style={{ animationDelay: `${i * 22}ms` }}>
              {ch}
            </span>
          </span>
        )
      })}
    </span>
  )
}

function MiniKpi(props: { icon: React.ReactNode; label: string }) {
  return (
    <div className="beam-pill px-4 py-3 text-sm text-[color:var(--text)]">
      <div className="flex items-center gap-2">
        <span className="text-[color:var(--accent2)]">{props.icon}</span>
        <span className="text-[color:var(--muted)]">{props.label}</span>
      </div>
    </div>
  )
}

function CarouselCard(props: {
  slot: '1' | '2' | '3'
  title: string
  value: string
  detail: string
  accent: string
}) {
  const ref = React.useRef<HTMLDivElement | null>(null)

  return (
    <div
      ref={ref}
      data-slot={props.slot}
      className="carousel-card flash-card p-5 sm:p-6"
      onMouseMove={(e) => setFlashPos(e, ref.current)}
      onMouseLeave={() => resetFlash(ref.current)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs tracking-[0.22em] uppercase text-[color:var(--muted)]">
            {props.title}
          </div>
          <div className="mt-2 text-2xl font-display" style={{ letterSpacing: '-0.04em' }}>
            {props.value}
          </div>
        </div>
        <div
          className="h-10 w-10 rounded-2xl"
          style={{
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), transparent 55%), ${props.accent}`,
            filter: 'saturate(1.15)',
            boxShadow: `0 0 0 1px color-mix(in oklab, ${props.accent} 35%, transparent)`,
          }}
        />
      </div>
      <div className="mt-3 text-sm text-[color:var(--muted)] leading-relaxed">{props.detail}</div>
    </div>
  )
}

function FlashCard(props: { title: string; body: string; tag: string }) {
  const ref = React.useRef<HTMLDivElement | null>(null)

  return (
    <div
      ref={ref}
      className="flash-card p-6"
      onMouseMove={(e) => setFlashPos(e, ref.current)}
      onMouseLeave={() => resetFlash(ref.current)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs tracking-[0.22em] uppercase text-[color:var(--muted)]">
          {props.tag}
        </div>
        <div className="beam-pill px-3 py-1.5 text-xs text-[color:var(--muted)]">
          {props.title}
        </div>
      </div>
      <div className="mt-3 text-xl font-display">{props.title}</div>
      <div className="mt-2 text-sm text-[color:var(--muted)] leading-relaxed">{props.body}</div>
    </div>
  )
}

function setFlashPos(e: React.MouseEvent, el: HTMLDivElement | null) {
  if (!el) return
  const r = el.getBoundingClientRect()
  const x = ((e.clientX - r.left) / r.width) * 100
  const y = ((e.clientY - r.top) / r.height) * 100
  el.style.setProperty('--mx', `${x}%`)
  el.style.setProperty('--my', `${y}%`)
}

function resetFlash(el: HTMLDivElement | null) {
  if (!el) return
  el.style.setProperty('--mx', `50%`)
  el.style.setProperty('--my', `50%`)
}


