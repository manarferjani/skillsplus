import { createLazyFileRoute } from '@tanstack/react-router'
import index from '@/features/courses/javascriptCourse/index'

export const Route = createLazyFileRoute('/_authenticated/courses/javascript')({
  component: index,
})

 