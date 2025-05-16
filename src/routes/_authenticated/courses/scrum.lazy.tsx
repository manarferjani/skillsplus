import { createLazyFileRoute } from '@tanstack/react-router'
import index from '@/features/courses/scrumCourse/index'

export const Route = createLazyFileRoute('/_authenticated/courses/scrum')({
  component: index,
})

 