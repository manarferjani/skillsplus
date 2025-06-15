import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { getTestById } from '@/services/test.service'
import { getUserById } from '@/services/users.service'
import { useInView } from 'react-intersection-observer'

interface Props {
  notification: {
    _id: string
    message: string
    createdAt: string
    read: boolean
    link?: string
    type?: string
  }
  onRead: (id: string) => void
  modalIsOpen: boolean
  onClick?: () => void
}

function extractAuthData(
  message: string
): { userId: string; testId: string } | null {
  const regex = /userId:([a-f\d]{24}),\s*testId:([a-f\d]{24})/i
  const match = message.match(regex)
  if (match) {
    return { userId: match[1], testId: match[2] }
  }
  return null
}

export default function NotificationItem({
  notification,
  onRead,
  modalIsOpen,
  onClick,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const { inView, ref: inViewRef } = useInView({
    threshold: 0.5,
    triggerOnce: true,
  })

  const [enrichedMessage, setEnrichedMessage] = useState<string>(
    notification.message
  )

  // Combine refs
  useEffect(() => {
    if (ref.current) {
      inViewRef(ref.current)
    }
  }, [inViewRef])

  // Mark as read if in view
  useEffect(() => {
    if (inView && !notification.read) {
      onRead(notification._id)
    }
  }, [inView, notification.read])

  // Mark as read if modal open and in viewport
  useEffect(() => {
    if (modalIsOpen && !notification.read && ref.current) {
      const timer = setTimeout(() => {
        if (isElementInViewport(ref.current!)) {
          onRead(notification._id)
        }
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [modalIsOpen, notification.read])

  const isElementInViewport = (el: HTMLElement): boolean => {
    const rect = el.getBoundingClientRect()
    return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight
  }

  // Enrich message if it's an authorization type
  useEffect(() => {
    const controller = new AbortController()

    const enrichMessage = async () => {
      if (notification.type === 'authorization') {
        const authData = extractAuthData(notification.message)
        if (authData) {
          try {
            const user = await getUserById(authData.userId)
            const test = await getTestById(authData.testId, {
              signal: controller.signal,
            })
            setEnrichedMessage(
              `${user.name} requested to rejoin the test: ${test.title}`
            )
          } catch (err) {
            if ((err as any).name !== 'AbortError') {
              setEnrichedMessage('Authorization request (details unavailable)')
              console.error('Erreur enrichissement message:', err)
            }
          }
        }
      }
    }

    enrichMessage()

    return () => controller.abort()
  }, [notification])

  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      navigate({ to: '/calendar' }) // fallback
    }

    if (!notification.read) {
      onRead(notification._id)
    }
  }

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className='flex cursor-pointer items-start space-x-3 rounded-md p-2 transition hover:bg-gray-50'
    >
      <div className='h-10 w-10 rounded-full bg-gray-200' />
      <div className='min-w-0 flex-1'>
        <div className='flex items-center justify-between'>
          <p className='text-sm text-gray-700'>{enrichedMessage}</p>
          {!notification.read && (
            <div className='h-2 w-2 rounded-full bg-blue-600' />
          )}
        </div>
        <p className='mt-1 text-xs text-gray-400'>
          {new Date(notification.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  )
}
