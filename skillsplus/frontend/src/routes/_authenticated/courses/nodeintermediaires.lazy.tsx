import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute(
  '/_authenticated/courses/nodeintermediaires',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/courses/nodeintermediaires"!</div>
}
