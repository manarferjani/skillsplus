import { createLazyFileRoute } from '@tanstack/react-router'
import UserProfile from '@/features/manager/dashboard/components/userProfile'

export const Route = createLazyFileRoute('/_authenticated/userProfile/')({
  component: UserProfile,
})
