import React from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectDropdown } from '@/components/select-dropdown'

interface DecisionData {
  userId: string
  role: string
  decision: 'accept' | 'reject'
}

interface UserPendingModalProps {
  isOpen: boolean
  onClose: () => void
  userData: {
    id: string
    name: string
    email: string
    role: string
    jobPosition?: string
    gender?: string
  }
  onSubmit: (data: DecisionData) => void
  isAdmin?: boolean
}

export default function UserPendingModal({
  isOpen,
  onClose,
  userData,
  onSubmit,
  isAdmin = false,
}: UserPendingModalProps) {
  const form = useForm<{ role: string }>({
    defaultValues: {
      role: userData.role,
    },
  })

  const handleSubmit = (data: { role: string }) => {
    onSubmit({ userId: userData.id, role: data.role, decision: 'accept' })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(state) => !state && onClose()}>
      <DialogContent className='!rounded-3xl sm:max-w-lg'>
        <DialogHeader className='text-left'>
          <DialogTitle>Pending Request</DialogTitle>
          <DialogDescription>
            Accept or reject this user request.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-4 py-2'
          >
            {/* Name */}
            <div className='grid grid-cols-6 items-center gap-x-4'>
              <label className='col-span-2 text-right text-sm font-medium'>
                Name
              </label>
              <Input value={userData.name} readOnly className='col-span-4' />
            </div>

            {/* Email */}
            <div className='grid grid-cols-6 items-center gap-x-4'>
              <label className='col-span-2 text-right text-sm font-medium'>
                Email
              </label>
              <Input value={userData.email} readOnly className='col-span-4' />
            </div>

            {/* Job Position */}
            <div className='grid grid-cols-6 items-center gap-x-4'>
              <label className='col-span-2 text-right text-sm font-medium'>
                Job Position
              </label>
              <Input
                value={userData.jobPosition || 'N/A'}
                readOnly
                className='col-span-4'
              />
            </div>

            {/* Gender */}
            <div className='grid grid-cols-6 items-center gap-x-4'>
              <label className='col-span-2 text-right text-sm font-medium'>
                Gender
              </label>
              <Input
                value={userData.gender || 'N/A'}
                readOnly
                className='col-span-4'
              />
            </div>

            {/* Role */}
            <FormField
              control={form.control}
              name='role'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center gap-x-4 space-y-0'>
                  <FormLabel className='col-span-2 text-right'>Role</FormLabel>
                  {isAdmin ? (
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='Select a role'
                      items={[
                        { label: 'Admin', value: 'admin' },
                        { label: 'Manager', value: 'manager' },
                        { label: 'Collaborator', value: 'collaborator' },
                      ]}
                      className='col-span-4'
                    />
                  ) : (
                    <Input
                      value={field.value}
                      readOnly
                      className='col-span-4'
                    />
                  )}
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />

            <DialogFooter>
              <div className='mt-2 flex justify-end gap-3'>
                <Button
                  type='button'
                  variant='destructive'
                  onClick={() =>
                    onSubmit({
                      userId: userData.id,
                      role: userData.role,
                      decision: 'reject',
                    })
                  }
                  className='rounded-3xl transition-transform hover:scale-105'
                >
                  Reject
                </Button>
                <Button
                  type='submit'
                  className='rounded-3xl bg-purple-200 text-black transition-transform hover:scale-105 hover:bg-purple-300'
                  style={{ backgroundColor: '#cec5fc' }}
                >
                  Accept
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
