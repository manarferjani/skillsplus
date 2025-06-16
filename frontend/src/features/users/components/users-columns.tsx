import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import LongText from '@/components/long-text'
import { callTypes, userTypes } from '../data/data'
import { User } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

// Définition des libellés des positions (ajouté en haut du fichier)
const JOB_POSITION_LABELS = {
  fullStackDeveloper: 'Full-Stack Developer',
  frontendDeveloper: 'Frontend Developer',
  backendDeveloper: 'Backend Developer',
  unspecified: 'Not specified', // Libellé anglais
} as const

export const columns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    meta: {
      className: cn(
        'sticky md:table-cell left-0 z-10 rounded-tl',
        'bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted'
      ),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'profileImage',
    //header: () => <span>Profile</span>,
    cell: ({ row }) => {
      const { profileImage, name, gender } = row.original

      const getFallbackAvatar = () => {
        const params = new URLSearchParams({
          name: (name || 'User').split(' ').slice(0, 2).join(' '),
          background: gender === 'female' ? 'ff66b2' : '3b82f6',
          color: 'fff',
          rounded: 'true',
        })
        return `https://ui-avatars.com/api/?${params.toString()}`
      }

      return (
        <div className='flex justify-center'>
          <img
            src={profileImage || getFallbackAvatar()}
            alt={`${name}'s avatar`}
            className='h-8 w-8 rounded-full object-cover'
            onError={(e) => {
              e.currentTarget.src = getFallbackAvatar()
            }}
          />
        </div>
      )
    },
    meta: {
      className: cn('w-16 px-2', 'bg-background'),
    },
    enableHiding: false,
  },
  {
    id: 'username',
    accessorKey: 'username',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Username'
        className='text-blue-600'
      />
    ),
    cell: ({ row }) => {
      const username = row.getValue('username') as string
      return (
        <LongText
          className='max-w-36'
          contentClassName='text-xs'
          asChild
          threshold={20}
        >
          {username || '-'}
        </LongText>
      )
    },
    meta: {
      className: cn(
        'w-36',
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2pxrgb(255_255_255_/_0.1)] lg:drop-shadow-none',
        'bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
        'sticky left-6 md:table-cell'
      ),
    },
    enableHiding: false,
  },

  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Email'
        className='text-blue-600'
      />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap'>{row.getValue('email')}</div>
    ),
  },
  {
    accessorKey: 'jobPosition',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Job Position'
        className='text-blue-600'
      />
    ),
    cell: ({ row }) => {
      const position = row.getValue(
        'jobPosition'
      ) as keyof typeof JOB_POSITION_LABELS
      return (
        <div
          className={cn(
            'font-medium',
            position === 'unspecified' && 'italic text-gray-400'
          )}
        >
          {JOB_POSITION_LABELS[position]}
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Status'
        className='text-blue-600'
      />
    ),
    cell: ({ row }) => {
      const { status } = row.original
      const badgeColor = callTypes.get(status)
      return (
        <div className='flex space-x-2'>
          <Badge variant='outline' className={cn('capitalize', badgeColor)}>
            {row.getValue('status')}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableHiding: false,
    enableSorting: false,
  },
  {
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Role'
        className='text-blue-600'
      />
    ),
    cell: ({ row }) => {
      const { role } = row.original
      const userType = userTypes.find(({ value }) => value === role)

      if (!userType) {
        console.warn(`Role inconnu: ${role}`) // Log pour débogage
        return (
          <div className='flex items-center gap-x-2 text-muted-foreground'>
            <span className='text-sm capitalize'>{role}</span>
          </div>
        )
      }

      return (
        <div className='flex items-center gap-x-2'>
          <userType.icon className='h-4 w-4 text-muted-foreground' />
          <span className='text-sm capitalize'>{userType.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
