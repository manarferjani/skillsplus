import { createLazyFileRoute } from '@tanstack/react-router'
import index from '@/features/courses/kanbanCourse/index'

export const Route = createLazyFileRoute('/_authenticated/courses/kanban')({
  component: index,
})

 