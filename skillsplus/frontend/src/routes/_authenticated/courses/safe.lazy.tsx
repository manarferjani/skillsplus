import { createLazyFileRoute } from '@tanstack/react-router'
import index from '@/features/courses/safeCourse/index'

export const Route = createLazyFileRoute('/_authenticated/courses/safe')({
  component: index,
})

 