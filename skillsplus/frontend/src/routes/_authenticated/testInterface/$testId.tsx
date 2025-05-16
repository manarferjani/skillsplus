// src/routes/_authenticated/testInterface/$testId.tsx
import { createFileRoute } from '@tanstack/react-router'
import QuizInterface from '@/features/TestParticipation/testInterface'

export const Route = createFileRoute('/_authenticated/testInterface/$testId')({
  component: () => {
    const { testId } = Route.useParams()
    return <QuizInterface testId={testId} />
  },
})