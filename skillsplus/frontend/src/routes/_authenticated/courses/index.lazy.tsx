import { createLazyFileRoute } from '@tanstack/react-router'
import courses from '@/features/courses'

export const Route = createLazyFileRoute('/_authenticated/courses/')({
  component: courses,
})
