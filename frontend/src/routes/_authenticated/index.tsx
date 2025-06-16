import Dashboard from '@/features/manager/dashboard'
import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/_authenticated/')({
  component: Dashboard,
})
