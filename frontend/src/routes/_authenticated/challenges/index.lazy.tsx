import { createLazyFileRoute } from '@tanstack/react-router'
import Index from '@/features/challenges'

export const Route = createLazyFileRoute('/_authenticated/challenges/')({
  component: Index,
})
