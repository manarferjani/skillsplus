// src/routes/_authenticated/collaboratorHistory/$userId.tsx

import { createFileRoute } from '@tanstack/react-router'
import { getUserById } from '@/services/users.service'
import { getUserTestHistory } from '@/services/test.service'
import { userSchema } from '@/features/users/data/schema'
import { formattedTestSchema } from '@/features/tests/data/schema'

export const Route = createFileRoute('/_authenticated/collaboratorHistory/$userId')({
  loader: async ({ params }) => {
    const user = await getUserById(params.userId)
    const testHistory = await getUserTestHistory(params.userId)

    return {
      user: userSchema.parse(user),
      testHistory: formattedTestSchema.array().parse(testHistory),
    }
  },
})
