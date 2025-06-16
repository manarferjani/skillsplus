import { useEffect, useState } from 'react'
import { fetchNotifications } from '@/services/notification.service'
import { Bell } from 'lucide-react'
import NotificationModal from './notificationModal'

interface Notification {
  _id: string
  userId: string
  message: string
  type?: string
  createdAt: string
  read: boolean
}

interface NotificationBellProps {
  userId: string
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications(userId)
      setNotifications(data)
    } catch (err) {
      console.error('Erreur chargement notifications', err)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [userId])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleClose = () => {
    setIsOpen(false)
    loadNotifications() // Refresh after modal close
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className='relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-100 focus:outline-none'
        aria-label='Afficher les notifications'
      >
        <Bell className='h-5 w-5 text-gray-700' />
        {unreadCount > 0 && (
          <span className='absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs text-white'>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && <NotificationModal userId={userId} onClose={handleClose} />}
    </>
  )
}
