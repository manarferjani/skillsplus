import { createLazyFileRoute } from '@tanstack/react-router'
import Angularadvanced from '@/features/courses/angularCourse/angularadvanced'

export const Route = createLazyFileRoute('/_authenticated/courses/angularadvanced')({
  component: Angularadvanced,
})

 