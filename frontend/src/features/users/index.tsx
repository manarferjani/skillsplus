import { useState } from 'react'
import { Notification } from '@/interfaces/notification.interface'
import { useAuth } from '@/context/authContext'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import NotificationBell from '@/features/manager/components/notificationsBell'
import PendingRequests from './components/pendingRequests'
import { columns } from './components/users-columns'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersTable } from './components/users-table'
import { UsersProvider, useUsers } from './context/users-context'
import { useRequireAuth } from '@/hooks/useRequireAuth'

function UsersContent() {
  //const token = useRequireAuth()
  //console.log(token)

  //if (!token) return null
  const { users, loading, error, showPendingOnly } = useUsers()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const userId = user?.id

  if (loading) return <div>Loading users...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          {userId && (
            <NotificationBell userId={userId} />
          )}
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              {showPendingOnly ? 'Pending Requests' : 'User List'}
            </h2>
            <p className='text-muted-foreground'>
              {showPendingOnly
                ? 'Manage pending registration requests.'
                : 'Manage your users and their roles here.'}
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>

        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
          {showPendingOnly ? (
            <PendingRequests />
          ) : (
            <UsersTable data={users} columns={columns} />
          )}
        </div>
      </Main>

      <UsersDialogs />
    </>
  )
}

export default function Users() {
  return (
    <UsersProvider>
      <UsersContent />
    </UsersProvider>
  )
}
