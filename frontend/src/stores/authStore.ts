import { create } from 'zustand'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'



const ACCESS_TOKEN = 'access_token'
const REFRESH_TOKEN = 'refresh_token'




interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  level?: string
  profileImage?: string
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
  const cookieToken = Cookies.get(ACCESS_TOKEN)
  const cookieRefreshToken = Cookies.get(REFRESH_TOKEN)
  const initToken = cookieToken || ''
  const initRefreshToken = cookieRefreshToken || ''

  console.log("hhhhhhhhhh");

    const decoded = initToken ? jwtDecode(initToken) as any : null
    console.log("dddddddddd");

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
      user: decoded
        ? {
          id: decoded.id,
          name: decoded.name ?? '',
          email: decoded.email ?? '',
          role: decoded.role,
          level: decoded.level,
          profileImage: decoded.profileImage,
        }
        : null,
      isLoading: true,
      initialized: false,
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),

      accessToken: initToken,
      setAccessToken: (accessToken) => {
        console.log("[AuthStore] Nouveau token reçu:", accessToken)
        Cookies.set(ACCESS_TOKEN, accessToken, { expires: 1 })
        const decoded = jwtDecode(accessToken) as any
        console.log("[AuthStore] Utilisateur décodé:", decoded)
        set((state) => ({
          ...state,
          auth: {
            ...state.auth,
            accessToken,
            user: {
              id: decoded.id,
              name: decoded.name ?? '',
              email: decoded.email ?? '',
              role: decoded.role,
              level: decoded.level,
              profileImage: decoded.profileImage,
            }
          }
        }))
      },

      refreshToken: initRefreshToken,
      setRefreshToken: (refreshToken) => {
        Cookies.set(REFRESH_TOKEN, refreshToken, { expires: 7 })
        set((state) => ({
          ...state,
          auth: { ...state.auth, refreshToken }
        }))
      },

      resetAccessToken: () => {
        Cookies.remove(ACCESS_TOKEN)
        set((state) => ({
          ...state,
          auth: { ...state.auth, accessToken: '' }
        }))
      },

      reset: () => {
        Cookies.remove(ACCESS_TOKEN)
        Cookies.remove(REFRESH_TOKEN)
        set((state) => ({
          ...state,
          auth: {
            ...state.auth,
            user: null,
            accessToken: '',
            refreshToken: ''
          }
        }))
      },

      isAuthenticated: () => {
        const state = get()
        return !!state.auth.accessToken && !!state.auth.user
      },

      hasRole: (requiredRole: string) => {
        const state = get()
        return state.auth.user?.role === requiredRole
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
