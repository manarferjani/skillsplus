import { useEffect, useState } from 'react'
import axios from 'axios'
import { ColumnDef } from '@tanstack/react-table'
import { updateUser } from '@/services/users.service'
import { UserRole } from '@/types/types'
import { Button } from '@/components/ui/button'
import { User } from '../data/schema'
import UserPendingModal from './pendingModal'
// adapte le chemin à ton projet
import { UsersTable } from './users-table'
import apiClient from '@/lib/api-client'

// ou le bon chemin vers ton fichier
interface DecisionData {
  userId: string
  role: string
  decision: 'accept' | 'reject'
}

export default function PendingRequests() {
  const [pendingUsers, setPendingUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetch('/api/users/pending-requests')
      .then((res) => res.json())
      .then((data) => setPendingUsers(data.data))
      .catch((error) => {
        console.error(
          'Erreur lors de la récupération des pending users:',
          error
        )
      })
  }, [])

  const handleAccept = async (userId: string, role: UserRole) => {
    try {
      await updateUser(userId, { role, status: 'active' }) // ✅ ajout du statut
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error)
      alert('Échec de la mise à jour du rôle')
    }
  }

  const handleReject = async (userId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Token d’authentification manquant')

      // Appel à DELETE /api/users/delete/${userId}
      await apiClient.delete(`/api/users/delete/${userId}`, {
      })

      setPendingUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error)
      alert("Échec de la suppression de l'utilisateur")
    }
  }
  const handleRowClick = (user: User) => {
    setSelectedUser(user)
    setModalOpen(true)
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className='font-semibold'>{row.original.name}</div>
      ),
      meta: { className: 'w-[180px]' },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <div>{row.original.email}</div>,
      meta: { className: 'w-[220px]' },
    },
    {
      accessorKey: 'jobPosition',
      header: 'job Position',
      cell: ({ row }) => <div>{row.original.jobPosition || 'N/A'}</div>,
      meta: { className: 'w-[160px]' },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className='text-sm capitalize text-muted-foreground'>
          {row.original.status}
        </span>
      ),
      meta: { className: 'w-[120px]' },
    },

    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setSelectedUser(row.original)
              setModalOpen(true)
            }}
          >
            handle request
          </Button>
          <Button
            variant='destructive'
            size='sm'
            onClick={() => handleReject(row.original.id)}
          >
            Reject
          </Button>
        </div>
      ),
      meta: { className: 'w-[180px]' },
    },
  ]

  if (pendingUsers.length === 0) {
    return <p className='text-center text-gray-500'>No pending requests.</p>
  }

  return (
    <>
      <UsersTable
        columns={columns}
        data={pendingUsers}
        isPendingView={true}
        onRowClick={handleRowClick}
      />

      {selectedUser && (
        <UserPendingModal
          userData={selectedUser}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          isAdmin={true}
          onSubmit={(decisionData) => {
            if (decisionData.decision === 'accept') {
              const role = decisionData.role as
                | 'admin'
                | 'manager'
                | 'collaborator'
              handleAccept(decisionData.userId, role) // ✅ Maintenant, tous les arguments sont présents
            } else {
              handleReject(decisionData.userId)
            }
          }}
        />
      )}
    </>
  )
}
