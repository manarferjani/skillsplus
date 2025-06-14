import { useState } from 'react'
import { IconAlertTriangle } from '@tabler/icons-react'
import toast, { Toaster } from 'react-hot-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { User } from '../data/schema'
import { deleteUser } from '@/services/users.service'
import { useUsers } from '../context/users-context' // adapte le chemin si besoin


interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDeleteDialog({ open, onOpenChange, currentRow }: Props) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  const { removeUser } = useUsers()

  const handleDelete = async () => {
    if (value.trim() !== currentRow.username) return
    console.log('handleDelete called')

    setLoading(true)
    try {
      const response = await deleteUser(currentRow.id)

      toast.success('User deleted successfully')
      removeUser(currentRow.id)

      console.log('[RESPONSE]', response.data)

      onOpenChange(false)
    } catch (error: any) {
      console.error('[DELETE ERROR]', error)
      toast.error(`An error occurred while deleting the user: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        handleConfirm={handleDelete}
        disabled={value.trim() !== currentRow.username || loading}
        title={
          <span className='text-destructive'>
            <IconAlertTriangle
              className='mr-1 inline-block stroke-destructive'
              size={18}
            />{' '}
            Delete User
          </span>
        }
        desc={
          <div className='space-y-4'>
            <p className='mb-2'>
              Are you sure you want to delete{' '}
              <span className='font-bold'>{currentRow.username}</span>?
              <br />
              This action will permanently remove the user with the role of{' '}
              <span className='font-bold'>
                {currentRow.role.toUpperCase()}
              </span>{' '}
              from the system. This cannot be undone.
            </p>

            <Label className='my-2'>
              Username:
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder='Enter username to confirm deletion.'
                disabled={loading}
              />
            </Label>

            <Alert variant='destructive'>
              <AlertTitle>Warning!</AlertTitle>
              <AlertDescription>
                Please be careful, this operation cannot be undone.
              </AlertDescription>
            </Alert>
          </div>
        }
        confirmText={loading ? 'Deleting...' : 'Delete'}
        destructive
      />
    </>
  )
}
