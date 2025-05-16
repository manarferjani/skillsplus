import { createFileRoute } from '@tanstack/react-router'
import { getUserById } from '@/services/users.service'
import { userSchema } from '@/features/users/data/schema'
import { z } from 'zod'
import UserProfile from '@/features/profile/userProfile'

type UserType = z.infer<typeof userSchema>

export const Route = createFileRoute('/_authenticated/userProfile/$userId')({
  loader: async ({ params }) => {
    console.log('Loader appelé avec params:', params)
    const user = await getUserById(params.userId)
    if (!user) {
      throw new Error('Utilisateur introuvable')
    }
    return { user }
  },
  component: UserProfile,
})
