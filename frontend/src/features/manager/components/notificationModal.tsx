import { useEffect, useState } from 'react'
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/notification.service'
import { getTestById } from '@/services/test.service'
import { getUserById } from '@/services/users.service'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog'
import NotificationItem from './notificationItem'

interface Notification {
  _id: string
  userId: string
  message: string
  type?: string
  createdAt: string
  read: boolean
}

interface NotificationModalProps {
  userId: string
  onClose: () => void
}
function extractAuthData(message: string): { userId: string; testId: string } {
  const regex = /userId:([a-f\d]{24}),\s*testId:([a-f\d]{24})/i
  const match = message.match(regex)
  if (match) {
    return { userId: match[1], testId: match[2] }
  }
  return { userId: 'unknown', testId: 'unknown' }
}


export default function NotificationModal({
  userId,
  onClose,
}: NotificationModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState<string>('all')

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await fetchNotifications(userId)
        setNotifications(data)
      } catch (err) {
        console.error('Erreur lors du chargement des notifications', err)
      }
    }

    getData()
  }, [userId])

  const [authModalData, setAuthModalData] = useState<{
    userId: string
    testId: string
  } | null>(null)

  const handleMarkAllAsRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

    try {
      await markAllNotificationsAsRead(userId)
    } catch (err) {
      // Rollback en cas d'erreur
      setNotifications((prev) => prev.map((n) => ({ ...n, read: n.read })))
      console.error('Erreur lors du marquage global', err)
    }
  }

  const handleIndividualRead = async (id: string) => {
    try {
      await markNotificationAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      )
    } catch (err) {
      console.error('Erreur lors du marquage individuel', err)
    }
  }

  type AuthorizationContentProps = {
    userId: string
    testId: string
    onClose: () => void
  }

  function AuthorizationContent({
    userId,
    testId,
    onClose,
  }: AuthorizationContentProps) {
    const [collaboratorName, setCollaboratorName] = useState<string>('...')
    const [testTitle, setTestTitle] = useState<string>('...')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      const abortController = new AbortController()

      async function fetchData() {
        try {
          const user = await getUserById(userId)
          const test = await getTestById(testId, {
            signal: abortController.signal,
          })

          setCollaboratorName(user.name)
          setTestTitle(test.title)
        } catch (err: unknown) {
          if (
            typeof err === 'object' &&
            err !== null &&
            'name' in err &&
            (err as { name: string }).name === 'AbortError'
          ) {
            console.log('Fetch aborted')
          } else {
            setCollaboratorName('Unknown')
            setTestTitle('Unknown')
          }
        } finally {
          setLoading(false)
        }
      }

      fetchData()

      return () => {
        abortController.abort()
      }
    }, [userId, testId])

    const handleAuthorize = () => {
      alert('Authorized')
      onClose()
    }

    const handleDeny = () => {
      alert('Denied')
      onClose()
    }

    if (loading)
      return <p style={{ textAlign: 'center', padding: '2rem' }}>Loading...</p>

    return (
      <div
        style={{
          maxWidth: '400px',
          margin: '2rem auto',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          backgroundColor: '#fff',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          color: '#333',
        }}
      >
        <h2
          style={{
            marginBottom: '1rem',
            fontWeight: '700',
            fontSize: '1.5rem',
          }}
        >
          Authorization Request
        </h2>

        <p style={{ marginBottom: '1.5rem', fontSize: '1rem', color: '#555' }}>
          The collaborator below was kicked out of the test and requests to
          rejoin. Please review the details and decide whether to authorize
          access.
        </p>

        <p style={{ marginBottom: '0.5rem' }}>
          <strong>Collaborator:</strong> {collaboratorName}
        </p>
        <p style={{ marginBottom: '0.5rem' }}>
          <strong>Test:</strong> {testTitle}
        </p>
        <p style={{ marginBottom: '1.5rem', color: '#666' }}>
          <strong>Date:</strong> {new Date().toLocaleString()}
        </p>
        <p style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>
          Do you authorize the collaborator to rejoin the test?
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={handleAuthorize}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#4CAF50',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
              marginRight: '0.5rem',
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = '#45a049')
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = '#4CAF50')
            }
          >
            Authorize
          </button>
          <button
            onClick={handleDeny}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              color: '#555',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
              marginLeft: '0.5rem',
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = '#f2f2f2')
            }
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
          >
            Deny
          </button>
        </div>
      </div>
    )
  }

  function AuthorizationModal({
    userId,
    testId,
    onClose,
  }: AuthorizationContentProps) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <AuthorizationContent
            userId={userId}
            testId={testId}
            onClose={onClose}
          />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className='max-w-2xl gap-0 p-0'>
          <div className='p-6 pb-4'>
            <div className='flex items-center justify-between'>
              <h2 className='text-2xl font-semibold'>Your notifications</h2>
              <Button
                variant='ghost'
                className='text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                onClick={handleMarkAllAsRead}
              >
                <Check className='mr-2 h-4 w-4' />
                Mark all as read
              </Button>
            </div>
          </div>

          <div className='px-6'>
            <div className='flex space-x-1 rounded-lg bg-gray-100 p-1'>
              <button
                onClick={() => setActiveTab('all')}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  activeTab === 'all'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600'
                }`}
              >
                All
                <Badge variant='secondary' className='ml-2'>
                  {notifications.length}
                </Badge>
              </button>
            </div>
          </div>

          <div className='max-h-96 space-y-4 overflow-y-auto p-6 pt-6'>
            {notifications.length === 0 ? (
              <p className='text-sm text-gray-500'>No notifications</p>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onRead={handleIndividualRead}
                  onClick={() => {
                    if (notification.type === 'authorization') {
                      const { userId, testId } = extractAuthData(
                        notification.message
                      )
                      setAuthModalData({ userId, testId })
                    }
                  }}
                  modalIsOpen={true} // ✅ cette ligne est obligatoire
                />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      {authModalData && (
        <AuthorizationModal
          userId={authModalData.userId}
          testId={authModalData.testId}
          onClose={() => setAuthModalData(null)}
        />
      )}
    </>
  )
}
