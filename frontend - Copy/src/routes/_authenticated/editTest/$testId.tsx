// src/routes/editTest.route.ts
import { createFileRoute } from '@tanstack/react-router'
import EditTestForm from '@/features/editTest'


export const Route = createFileRoute('/_authenticated/editTest/$testId')({
  component: () => {
    const { testId } = Route.useParams()
    return <EditTestForm testId={testId} />
  },
})