import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { IconUser } from '@tabler/icons-react'
import { getUserById } from '@/services/users.service'
import { authAPI } from '@/lib/api-client'
import { useAuth } from '@/context/authContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNavigate } from '@tanstack/react-router'

export function ProfileDropdown() {
  const { user: authUser } = useAuth()
  const [user, setUser] = useState(authUser)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const navigate = useNavigate() // 👈

  const handleLogout = async () => {
    await authAPI.logout() // Appelle simplement le logout
    navigate({ to: '/sign-in-2' }) // Redirection SPA
  }

  useEffect(() => {
    const fetchFullUser = async () => {
      if (authUser?.id) {
        try {
          const fullUser = await getUserById(authUser.id)
          setUser(fullUser)

          if (fullUser.profileImage) {
            const isFullUrl = fullUser.profileImage.startsWith('http')
            const imageUrl = isFullUrl
              ? fullUser.profileImage
              : `http://localhost:5000${fullUser.profileImage}`
            setProfileImage(imageUrl)
          }
        } catch (error) {
          console.error("Erreur lors du chargement de l'utilisateur", error)
        }
      }
    }

    fetchFullUser()
  }, [authUser?.id])

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full p-0'>
          <Avatar className='h-10 w-10'>
            <AvatarImage
              src={profileImage || ''}
              alt={user?.name || 'Avatar'}
            />
            <AvatarFallback>
              <IconUser size={20} />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>
              {user?.name || 'Anonymous'}
            </p>
            <p className='text-xs leading-none text-muted-foreground'>
              {user?.email || 'no-email@example.com'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to='/settings' className='flex w-full justify-between'>
              Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
