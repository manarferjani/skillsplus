// src/routes/_authenticated/pinboard/index.lazy.tsx
import { createLazyFileRoute } from '@tanstack/react-router'
import Pinboard from '@/features/pinboard'

export const Route = createLazyFileRoute('/_authenticated/pinboard/')({
  component: Pinboard,
})
