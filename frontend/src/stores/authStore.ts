import Cookies from 'js-cookie'
import { create } from 'zustand'

const ACCESS_TOKEN = 'access_token'
const REFRESH_TOKEN = 'refresh_token'

interface AuthUser {
  id: string
  name: string
  email: string
  role: number // 1=admin, 2=manager, 3=collaborator
  roleName: string
  clerkId?: string
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    refreshToken: string
    setRefreshToken: (refreshToken: string) => void
    resetAccessToken: () => void
    reset: () => void
    isAuthenticated: () => boolean
    hasRole: (requiredRole: number) => boolean
    isLoading: boolean
    setIsLoading: (isLoading: boolean) => void
    initialized: boolean
  }
}

export const useAuthStore = create<AuthState>()((set, get) => {
  // Initialize with a loading state
  const initializing = true

  // Try to get tokens from cookies
  const cookieToken = Cookies.get(ACCESS_TOKEN)
  const cookieRefreshToken = Cookies.get(REFRESH_TOKEN)
  const initToken = cookieToken || ''
  const initRefreshToken = cookieRefreshToken || ''
  
  // Once we've checked cookies, we're initialized
  setTimeout(() => {
    set((state) => ({ 
      ...state, 
      auth: { 
        ...state.auth, 
        isLoading: false,
        initialized: true
      } 
    }))
  }, 0)
  
  return {
    auth: {
      user: null,
      isLoading: initializing,
      initialized: false,
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),
      accessToken: initToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          Cookies.set(ACCESS_TOKEN, accessToken, { expires: 1 }) // Expires in 1 day
          return { ...state, auth: { ...state.auth, accessToken } }
        }),
      refreshToken: initRefreshToken,
      setRefreshToken: (refreshToken) =>
        set((state) => {
          Cookies.set(REFRESH_TOKEN, refreshToken, { expires: 7 }) // Expires in 7 days
          return { ...state, auth: { ...state.auth, refreshToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          Cookies.remove(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          Cookies.remove(ACCESS_TOKEN)
          Cookies.remove(REFRESH_TOKEN)
          return {
            ...state,
            auth: { 
              ...state.auth, 
              user: null, 
              accessToken: '', 
              refreshToken: '' 
            },
          }
        }),
      isAuthenticated: () => {
        const state = get()
        return !!state.auth.accessToken && !!state.auth.user
      },
      hasRole: (requiredRole) => {
        const state = get()
        if (!state.auth.user) return false
        
        // Lower role numbers have more privileges
        // 1=admin, 2=manager, 3=collaborator
        return state.auth.user.role <= requiredRole
      },
      setIsLoading: (isLoading) =>
        set((state) => ({ 
          ...state, 
          auth: { 
            ...state.auth, 
            isLoading 
          } 
        }))
    },
  }
})

export const useAuth = () => useAuthStore((state) => state.auth)
