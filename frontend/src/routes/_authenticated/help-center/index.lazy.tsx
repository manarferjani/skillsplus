import { createLazyFileRoute } from '@tanstack/react-router'
import Helpcenter  from '@/components/Helpcenter'

export const Route = createLazyFileRoute('/_authenticated/help-center/')({
  component: Helpcenter,
})
