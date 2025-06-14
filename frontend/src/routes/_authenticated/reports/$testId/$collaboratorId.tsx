// src/routes/_authenticated/reports/$testId/$collaboratorId.tsx
import { createFileRoute } from '@tanstack/react-router'
import ReportPage from '@/features/manager/reports'

export const Route = createFileRoute('/_authenticated/reports/$testId/$collaboratorId')({
  component: () => {
    const { testId, collaboratorId } = Route.useParams()
    return <ReportPage testId={testId} collaboratorId={collaboratorId} />
  },
})
