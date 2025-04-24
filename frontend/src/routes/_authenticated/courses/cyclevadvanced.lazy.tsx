import { createLazyFileRoute } from '@tanstack/react-router'
import Cyclevadvanced from '@/features/courses/cyclevCourse/cyclevadvanced'

export const Route = createLazyFileRoute('/_authenticated/courses/cyclevadvanced')({
  component: Cyclevadvanced,
})

 