// NotificationProvider.tsx
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import type { ReactNode } from 'react'

interface NotificationProviderProps {
  userId: string
  children: ReactNode
}

const NotificationProvider = ({ userId, children }: NotificationProviderProps) => {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!userId) return

    // Créer la socket une seule fois
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket'], // plus stable
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('🟢 Connecté au serveur Socket.IO avec socket.id =', socket.id)
      socket.emit('register', userId)
      console.log('📲 userId envoyé au serveur via socket :', userId)
    })

    socket.on('connect_error', (err) => {
      console.error('❌ Erreur de connexion Socket.IO:', err.message)
    })

    socket.on('receiveNotification', (data: { message: string }) => {
      toast.info(data.message)
      console.log('📲 Notification reçue côté client:', data)
    })

    return () => {
      socket.disconnect()
    }
  }, [userId])

  return (
    <>
      {children}
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  )
}

export default NotificationProvider
