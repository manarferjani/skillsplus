import Cyclevintermediares from '@/features/courses/cyclevCourse/cyclevintermediaires'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute(
  '/_authenticated/courses/cyclevintermediaires',
)({
  component: Cyclevintermediares,
})


