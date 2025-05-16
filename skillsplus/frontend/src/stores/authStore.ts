import { create } from 'zustand'
import Cookies from 'js-cookie'

const ACCESS_TOKEN = 'access_token'
const REFRESH_TOKEN = 'refresh_token'

interface AuthUser {
  id: string
  name: string
  email: string
  role: string  // 'admin', 'manager', 'collaborator'
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
    hasRole: (requiredRole: string) => boolean
    isLoading: boolean
    setIsLoading: (isLoading: boolean) => void
    initialized: boolean
  }
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const initializing = true

  const cookieToken = Cookies.get(ACCESS_TOKEN)
  const cookieRefreshToken = Cookies.get(REFRESH_TOKEN)
  const initToken = cookieToken || ''
  const initRefreshToken = cookieRefreshToken || ''

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
          
          Cookies.set(ACCESS_TOKEN, accessToken, { expires: 1 })
          return { ...state, auth: { ...state.auth, accessToken } }
        }),
      
      refreshToken: initRefreshToken,
      setRefreshToken: (refreshToken) =>
        set((state) => {
          Cookies.set(REFRESH_TOKEN, refreshToken, { expires: 7 })
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

      hasRole: (requiredRole: string) => {
        const state = get()
        if (!state.auth.user) return false

        // Comparaison directe des rôles sous forme de string
        return state.auth.user.role === requiredRole
      },

      setIsLoading: (isLoading) =>
        set((state) => ({
          ...state,
          auth: {
            ...state.auth,
            isLoading
          }
        }))
    }
  }
})

export const useAuth = () => useAuthStore((state) => state.auth)
