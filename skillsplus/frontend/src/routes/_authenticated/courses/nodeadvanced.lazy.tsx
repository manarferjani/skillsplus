import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute(
  '/_authenticated/courses/nodeadvanced',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/courses/nodeadvanced"!</div>
}
