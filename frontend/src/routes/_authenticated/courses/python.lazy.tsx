import { createLazyFileRoute } from '@tanstack/react-router'
import index from '@/features/courses/pythonCourse/index'

export const Route = createLazyFileRoute('/_authenticated/courses/python')({
  component: index,
})

 