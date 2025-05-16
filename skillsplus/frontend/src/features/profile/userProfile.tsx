import { useLoaderData , useNavigate} from '@tanstack/react-router'
import { Route } from '@/routes/_authenticated/userProfile/$userId'
import { userSchema } from '@/features/users/data/schema'
import { z } from 'zod'

type UserType = z.infer<typeof userSchema>

export default function UserProfile() {
  const data = useLoaderData({ from: Route.id })
  const navigate = useNavigate()  // On récupère le navigateur pour la redirection
  console.log('Données du loader dans UserProfile:', data)

  const { user } = data as unknown as { user: UserType }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 font-semibold">Utilisateur introuvable.</p>
      </div>
    )
  }

  const parsedUser = userSchema.safeParse(user)

  if (!parsedUser.success) {
    console.error('Erreur de validation de l\'utilisateur', parsedUser.error.errors)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 font-semibold">Utilisateur invalide.</p>
      </div>
    )
  }

  const validatedUser = parsedUser.data

  // Fonction pour rediriger vers l'historique des tests du collaborateur
  const handleProgressionClick = () => {
    navigate({
      to: `/collaboratorHistory/${validatedUser.id}`,
      replace: true,
    })
    
 // Naviguer vers la page historique des tests du collaborateur
  }

  return (
    <div className="min-h-screen bg-white p-6 flex items-center justify-center">
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-5xl">
        {/* Profile Card */}
        <div className="bg-white border border-gray-300 rounded-3xl shadow-lg p-6 flex-1">
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40 mb-4">
              <img
                src={validatedUser.photo || "/placeholder.svg?height=160&width=160"}
                alt="Profile"
                width={160}
                height={160}
                className="rounded-full object-cover"
              />
            </div>
            <h2 className="text-xl font-semibold mb-1">{validatedUser.name}</h2>
            <p className="text-xs text-gray-400 mb-1">Last login: {validatedUser.lastLogin}</p>
            <p className="text-xs text-gray-400 mb-6">{validatedUser.location}</p>

            {/* Section infos personnelles */}
            <div className="w-full space-y-4 text-left">
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500">Nom</p>
                <p className="text-base font-medium text-gray-800">{validatedUser.name}</p>
              </div>
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-base font-medium text-gray-800">{validatedUser.email}</p>
              </div>
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500">Poste</p>
                <p className="text-base font-medium text-gray-800">{validatedUser.jobPosition}</p> {/* Ajout de la position */}
              </div>
            </div>
          </div>
        </div>

        {/* Badges + Progression */}
        <div className="flex flex-col gap-6 flex-1">
          {/* Section Badges */}
          <div className="bg-white border border-gray-300 rounded-3xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Badges</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>Collaborateur du mois</li>
              <li>100% taux de complétion</li>
            </ul>
          </div>

          {/* Section Progression */}
          <div className="bg-white border border-gray-300 rounded-3xl shadow-lg p-6"
          onClick={handleProgressionClick}
          >
            <h2 className="text-xl font-semibold mb-4">Progression</h2>
            <p className="text-sm text-gray-700">Statistiques à venir (tests réussis, formations suivies...)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
