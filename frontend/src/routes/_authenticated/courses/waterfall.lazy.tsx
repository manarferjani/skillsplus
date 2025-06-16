import { createLazyFileRoute } from '@tanstack/react-router'
import index from '@/features/courses/waterfallCourse/index'

export const Route = createLazyFileRoute('/_authenticated/courses/waterfall')({
  component: index,
})

 