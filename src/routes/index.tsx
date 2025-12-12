import { createFileRoute } from '@tanstack/react-router'
import LandingHero from '@/components/landing/LandingHero'

export const Route = createFileRoute('/')({ component: LandingHero })
