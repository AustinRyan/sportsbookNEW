export const Route = createFileRoute('/app/sports')({
  component: SportsLayout,
})

import { Outlet, createFileRoute } from '@tanstack/react-router'

function SportsLayout() {
  return (
    <Outlet />
  )
}
