import { createLazyFileRoute } from '@tanstack/react-router'
import calendar from '@/features/calendar'

export const Route = createLazyFileRoute('/_authenticated/calendar/')({
  component: calendar,
})
