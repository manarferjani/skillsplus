import { createLazyFileRoute } from '@tanstack/react-router'
import index from '@/features/courses/angularCourse/index'

export const Route = createLazyFileRoute('/_authenticated/courses/angular')({
  component: index,
})

 