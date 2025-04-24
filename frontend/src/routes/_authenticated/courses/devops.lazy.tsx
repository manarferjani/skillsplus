import { createLazyFileRoute } from '@tanstack/react-router'
import index from '@/features/courses/devopsCourse/index'

export const Route = createLazyFileRoute('/_authenticated/courses/devops')({
  component: index,
})

 