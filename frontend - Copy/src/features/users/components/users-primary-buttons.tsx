import { IconUserPlus, IconClock, IconUsersGroup } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useUsers } from '../context/users-context'
import { Badge } from '@/components/ui/badge'

export function UsersPrimaryButtons() {
  const { setOpen, users, showPendingOnly, setShowPendingOnly } = useUsers()
  const pendingCount = users.filter((u) => u.role === 'unspecified').length

  return (
    <div className='flex gap-2'>
      {!showPendingOnly && (
        <>
          <Button
            className='space-x-1 rounded-3xl text-black transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-lg'
            style={{ backgroundColor: '#cec5fc' }}
            onClick={() => setOpen('add')}
          >
            <span>Add User</span> <IconUserPlus size={18} />
          </Button>

          <Button
            variant='outline'
            className='relative space-x-1 rounded-3xl'
            onClick={() => setShowPendingOnly(true)}
          >
            <span>Pending</span>
            <IconClock size={18} />
            {pendingCount > 0 && (
              <Badge
                className='absolute -top-2 -right-2 rounded-full px-2 py-0.5 text-xs bg-red-500 text-white'
                variant='secondary'
              >
                {pendingCount}
              </Badge>
            )}
          </Button>
        </>
      )}

      {showPendingOnly && (
        <Button
          variant='outline'
          className='space-x-1 rounded-3xl'
          style={{ backgroundColor: '#ffd3e8' }}
          onClick={() => setShowPendingOnly(false)}
        >
          <span>Team</span>
          <IconUsersGroup size={18} />
        </Button>
      )}
    </div>
  )
}
