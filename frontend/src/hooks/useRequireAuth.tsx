import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'

export function useRequireAuth() {
  const token = useAuthStore((state) => state.auth.accessToken) || localStorage.getItem('token')
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      
      navigate({ to: '/sign-in' })
    }
  }, [token, navigate])

  return token
}
