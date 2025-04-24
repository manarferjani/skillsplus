import { createLazyFileRoute } from '@tanstack/react-router'
import index from '@/features/courses/cyclevCourse/index'

export const Route = createLazyFileRoute('/_authenticated/courses/cyclev')({
  component: index,
})

 