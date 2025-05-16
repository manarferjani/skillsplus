import Dashboard from '@/features/manager/dashboard-manager'
import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/_authenticated/')({
  component: Dashboard,
})
