import { createLazyFileRoute } from '@tanstack/react-router'
import Angulardebutante from '@/features/courses/angularCourse/angulardebutante'

export const Route = createLazyFileRoute('/_authenticated/courses/angulardebutante')({
  component: Angulardebutante,
})

 