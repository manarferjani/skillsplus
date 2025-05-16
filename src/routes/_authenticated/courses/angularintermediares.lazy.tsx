import { createLazyFileRoute } from '@tanstack/react-router'
import Angularintermediares from '@/features/courses/angularCourse/angularintermediares'

export const Route = createLazyFileRoute('/_authenticated/courses/angularintermediares')({
  component: Angularintermediares,
})

 