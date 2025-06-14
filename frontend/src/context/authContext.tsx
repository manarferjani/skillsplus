import { createContext, useContext, useEffect, useState } from 'react'
import { getUserById } from '@/services/users.service'
import { jwtDecode } from 'jwt-decode'
import { useNavigate } from '@tanstack/react-router'

// Types
interface User {
  email: string
  id: string
  role: string
  name: string
  level: string
  profileImage?: string | null
}

interface AuthContextType {
  user: User | null
  login: (token: string) => void
  logout: () => void
  isLoading: boolean
  setUser: React.Dispatch<React.SetStateAction<User | null>>
}

// Contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    console.log('État utilisateur mis à jour:', user)
  }, [user])

  useEffect(() => {
    initializeAuth()
  }, [])

  function isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<{ exp?: number }>(token)
      if (!decoded.exp) return true
      return decoded.exp * 1000 < Date.now()
    } catch {
      return true
    }
  }
  useEffect(() => {
    if (!user) return

    const token = localStorage.getItem('token')
    if (!token) {navigate({ to: '/sign-in' })
     return }

    try {
      const decoded = jwtDecode<{ exp?: number }>(token)

      if (!decoded.exp) return

      const expiresIn = decoded.exp * 1000 - Date.now()
      const refreshTiming = Math.max(10000, expiresIn - 30000) // Rafraîchir 30s avant expiration

      const refreshTokenTimeout = setTimeout(async () => {
        try {
          const currentRefreshToken = localStorage.getItem('refreshToken')

          if (!currentRefreshToken) {
            console.log('Aucun refreshToken trouvé')
            logout()
            return
          }

          const response = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: currentRefreshToken }),
          })

          if (!response.ok) throw new Error('Erreur serveur')

          const result = await response.json()

          localStorage.setItem('token', result.token)
          localStorage.setItem('refreshToken', result.refreshToken)

          const newDecoded = jwtDecode<User>(result.token)

          // Recharger les données utilisateur si possible
          const fullUser = await getUserById(newDecoded.id)

          setUser({
            ...newDecoded,
            profileImage: fullUser.profileImage || null,
          })
        } catch (error) {
          console.error('Échec du rafraîchissement du token', error)
          logout()
        }
      }, refreshTiming)

      return () => clearTimeout(refreshTokenTimeout)
    } catch (error) {
      console.error(
        'Erreur lors de la configuration du rafraîchissement',
        error
      )
      logout()
    }
  }, [user])

  const initializeAuth = async () => {
    const token = localStorage.getItem('token')

    if (token) {
      try {
        const decoded = jwtDecode<User>(token)

        // Essaye de charger les données utilisateur
        let fullUser = null
        try {
          fullUser = await getUserById(decoded.id)
        } catch (apiError) {
          console.warn(
            'Erreur API, mais on continue avec les données du token',
            apiError
          )
        }

        // Mise à jour de l'utilisateur avec les données disponibles
        setUser({
          ...decoded,
          profileImage: fullUser?.profileImage || decoded.profileImage || null,
        })
      } catch (tokenError) {
        // Seulement si le token est vraiment invalide, on le supprime
        console.error('Token invalide:', tokenError)
        localStorage.removeItem('token')
        setUser(null)
      }
    }
    setIsLoading(false)
  }

  const login = async (token: string) => {
    setIsLoading(true) // Début du chargement
    try {
      localStorage.setItem('token', token)
      const decoded = jwtDecode<User>(token)

      const fullUser = await getUserById(decoded.id)
      const newUser = {
        ...decoded,
        profileImage: fullUser.profileImage || null,
      }

      // Mise à jour atomique
      setUser(newUser)
    } catch (error) {
      console.error('Échec du chargement des données utilisateur', error)
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setIsLoading(false) // Fin du chargement
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  // Fonction pour rafraîchir les données utilisateur depuis l'API
  async function refreshUser() {
    if (!user) return
    try {
      const updatedUserRaw = await getUserById(user.id)
      // Nettoyer profileImage si null en undefined
      const updatedUser: User = {
        ...updatedUserRaw,
        profileImage: updatedUserRaw.profileImage ?? undefined,
      }
      setUser(updatedUser)
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de l’utilisateur', error)
    }
  }
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (e.newValue) {
          const decoded = jwtDecode<User>(e.newValue)
          getUserById(decoded.id).then((fullUser) => {
            setUser({ ...decoded, profileImage: fullUser.profileImage })
          })
        } else {
          setUser(null)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personnalisé
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}
