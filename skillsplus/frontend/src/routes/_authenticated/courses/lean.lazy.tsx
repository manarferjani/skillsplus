import { createLazyFileRoute } from '@tanstack/react-router'
import index from '@/features/courses/leanCourse/index'

export const Route = createLazyFileRoute('/_authenticated/courses/lean')({
  component: index,
})

 