import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute(
  '/_authenticated/courses/safedebutante',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/courses/safedebutante"!</div>
}
