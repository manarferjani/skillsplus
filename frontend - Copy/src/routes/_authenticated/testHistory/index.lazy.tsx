import { createLazyFileRoute } from '@tanstack/react-router'
import testsHistoryTable from '@/features/manager/testHistory'

// Créer la route avec la fonction `createLazyFileRoute`
export const Route = createLazyFileRoute('/_authenticated/testHistory/')({
  component: testsHistoryTable, 
  
})
