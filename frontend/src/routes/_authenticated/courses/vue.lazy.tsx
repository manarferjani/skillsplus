import { createLazyFileRoute } from '@tanstack/react-router'
import index from '@/features/courses/vueCourse/index'

export const Route = createLazyFileRoute('/_authenticated/courses/vue')({
  component: index,
})

 