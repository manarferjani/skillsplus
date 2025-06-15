import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

export function RootPage() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate({ to: '/sign-in-2' })
  }, [navigate])

  return null
}
