import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { fetchUsers as fetchUsersService } from '../../../services/users.service'; // Importer la fonction depuis le service
import { userListSchema } from '../data/schema'
import type { User } from '../data/schema' 
import axios from 'axios';



type UsersContextType = {
  users: User[]
  loading: boolean
  error: string | null
  fetchUsers: () => Promise<void>
  addUser: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  open: 'add' | 'invite' | 'edit' | 'delete' | null
  setOpen: React.Dispatch<React.SetStateAction<'invite' | 'add' | null>>
  currentRow: User | null
  setCurrentRow: (user: User | null) => void

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
  const [open, setOpen] = useState<'invite' | 'add' | null>(null)
  const [currentRow, setCurrentRow] = useState<User | null>(null)


  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetchUsersService() // Appel à la fonction fetchUsers du service
      // Validation avec le schéma et mise à jour de l'état
      const validatedData = userListSchema.parse(response)  // Pas besoin de .data ici

      
      setUsers(validatedData)
    } catch (err) {
      const error = err as Error
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const addUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await axios.post<User>('http://localhost:5000/api/users', userData)
      setUsers(prev => [...prev, response.data])
    } catch (err) {
      const error = err as Error
      throw new Error(error.message)
    }
  }

  return (
    <UsersContext.Provider
    value={{
      users,
      loading,
      error,
      fetchUsers,   
      addUser,      
      open,
      setOpen,
      currentRow,
      setCurrentRow
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
