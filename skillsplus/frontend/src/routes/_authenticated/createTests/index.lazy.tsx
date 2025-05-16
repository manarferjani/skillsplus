import { createLazyFileRoute } from '@tanstack/react-router'
import AddTestForm from '@/features/createTests'

export const Route = createLazyFileRoute('/_authenticated/createTests/')({
  component: AddTestForm,
})
