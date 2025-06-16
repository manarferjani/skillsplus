import { createLazyFileRoute } from '@tanstack/react-router'
import { LevelDetailPage } from '@/features/courses/Course/LevelDetailPage'

export const Route = createLazyFileRoute('/_authenticated/courses/LevelDetailPage')({
  component: LevelDetailPage,
})