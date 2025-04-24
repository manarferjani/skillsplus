import { createLazyFileRoute } from '@tanstack/react-router'
import index from '@/features/courses/laravelCourse/index'

export const Route = createLazyFileRoute('/_authenticated/courses/laravel')({
  component: index,
})

 