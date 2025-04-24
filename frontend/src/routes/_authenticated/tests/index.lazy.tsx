import { createLazyFileRoute } from '@tanstack/react-router'
import Index from '@/features/tests'

export const Route = createLazyFileRoute('/_authenticated/tests/')({
  component: Index,
})
