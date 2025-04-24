import { createLazyFileRoute } from '@tanstack/react-router'
import index from '@/features/courses/reactCourse/index'

export const Route = createLazyFileRoute('/_authenticated/courses/react')({
  component: index,
})

 