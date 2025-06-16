import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import axios from 'axios'
import { fetchUsers as fetchUsersService } from '../../../services/users.service'
// Importer la fonction depuis le service
import { userListSchema } from '../data/schema'
import type { User } from '../data/schema'
import apiClient from '@/lib/api-client'

type ModalType = 'invite' | 'add' | 'edit' | 'delete' | null

type UsersContextType = {
  users: User[]
  loading: boolean
  error: string | null
  fetchUsers: () => Promise<void>
  addUser: (
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>
  removeUser: (id: string) => void
  open: ModalType
  setOpen: React.Dispatch<React.SetStateAction<ModalType>>
  currentRow: User | null
  setCurrentRow: (user: User | null) => void
  showPendingOnly: boolean // <-- ajouter
  setShowPendingOnly: (value: boolean) => void
}

// Contexte
const UsersContext = createContext<UsersContextType | undefined>(undefined)

// Props du Provider
type UsersProviderProps = {
  children: ReactNode
}

export const UsersProvider = ({ children }: UsersProviderProps) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<ModalType>(null)
  const [currentRow, setCurrentRow] = useState<User | null>(null)
  const [showPendingOnly, setShowPendingOnly] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetchUsersService()
      const validatedData = userListSchema.parse(response)
      setUsers(validatedData)
    } catch (err) {
      const error = err as Error
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const addUser = async (
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const response = await apiClient.post<User>(
        'http://localhost:5000/api/users',
        userData
      )
      setUsers((prev) => [...prev, response.data])
    } catch (err) {
      const error = err as Error
      throw new Error(error.message)
    }
  }

  const removeUser = (id: string) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id))
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <UsersContext.Provider
      value={{
        users,
        loading,
        error,
        fetchUsers,
        addUser,
        removeUser, // <-- Ajout ici
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        showPendingOnly,
        setShowPendingOnly,
      }}
    >
      {children}
    </UsersContext.Provider>
  )
}

// Hook personnalisé
export const useUsers = () => {
  const context = useContext(UsersContext)
  if (!context) {
    throw new Error('useUsers must be used within a UsersProvider')
  }
  return context
}
