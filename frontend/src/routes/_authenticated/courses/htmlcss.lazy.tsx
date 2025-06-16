import { createLazyFileRoute } from '@tanstack/react-router'
import index from '@/features/courses/htmlcssCourse/index'

export const Route = createLazyFileRoute('/_authenticated/courses/htmlcss')({
  component: index,
})

 