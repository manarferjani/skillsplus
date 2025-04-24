import { createLazyFileRoute } from '@tanstack/react-router'
import index from '@/features/courses/nodeCourse/index'

export const Route = createLazyFileRoute('/_authenticated/courses/node')({
  component: index,
})

 