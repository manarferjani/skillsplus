import { createLazyFileRoute } from '@tanstack/react-router'
import index from '@/features/courses/kotlinCourse/index'

export const Route = createLazyFileRoute('/_authenticated/courses/kotlin')({
  component: index,
})

 