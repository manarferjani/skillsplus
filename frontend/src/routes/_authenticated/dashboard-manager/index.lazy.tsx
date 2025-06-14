import { createLazyFileRoute } from '@tanstack/react-router'
import ManagerDashboard from '@/features/manager/dashboard-manager'

// Créer la route avec la fonction `createLazyFileRoute`
export const Route = createLazyFileRoute('/_authenticated/dashboard-manager/')({
  component: ManagerDashboard,  // Associer la route avec le composant AdminDashboard
})
