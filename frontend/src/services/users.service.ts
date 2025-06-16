import axios from "axios";
import { userListSchema, userSchema } from '../features/users/data/schema';
import { UserStatus, userStatuses } from '@/types/types'


export async function fetchUsers() {
  console.log("fetchUsers called");
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('/api/users/getallUsers', {
      headers: { authorization: `Bearer ${token}` }
    });

    const rawUsers = response.data.data;

    // Ne garder que les statuts valides
    const validStatuses: UserStatus[] = ['active', 'inactive', 'suspended'];
    const filteredUsers = rawUsers.filter((user: any) =>
      validStatuses.includes(user.status)
    );

    const formattedUsers = filteredUsers.map((user: any) => {
      const getAvatarUrl = () => {
        if (!user.profileImage) {
          const params = new URLSearchParams({
            name: user.name.split(' ').slice(0, 2).join('+'),
            background: user.gender === 'female' ? 'FFC8DD' : 'BDE0FE',
            color: 'FFFFFF',
            rounded: 'true',
            size: '128',
            length: '2',
            bold: 'true',
            nocache: Date.now().toString()
          });
          return `https://ui-avatars.com/api/?${params.toString()}`;
        }

        return user.profileImage.startsWith('http')
          ? user.profileImage
          : `http://localhost:5000${user.profileImage}`;
      };

      return {
        ...user,
        profileImage: getAvatarUrl()
      };
    });

    return userListSchema.parse(formattedUsers);
  } catch (error) {
    console.error("Fetch users error:", error);
    throw error;
  }
}

export const getMainAdminId = async () => {
  const { data } = await axios.get<{ adminId: string }>("/api/admins/get-main-admin")
  return data.adminId
}

export async function addUserWithEmail(userData: {
  name: string;
  email: string;
  password: string;
  role: string;
  jobPosition: string;
  status: 'active' | 'inactive' | 'blocked' | 'suspended';
  gender: string;
}) {
  try {
    console.log('Données envoyées:', userData); // Vérifiez ce qui est réellement envoyé
    const token = localStorage.getItem('token');
    const response = await axios.post('/api/users/addWithEmail', userData, {
      headers: { authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Erreur:", error);
    throw error;
  }
}


export async function getUserById(id: string) {
  if (!id) {
    throw new Error("L'identifiant de l'utilisateur est requis");
  }

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    // Requête API pour récupérer l'utilisateur
    const response = await axios.get(`/api/users/getUserById/${id}`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    if (!response.data || !response.data.data) {
      throw new Error('Données utilisateur manquantes');
    }

    console.log('Utilisateur récupéré:', response.data);

    const rawUser = response.data.data;

    // Transformation des données de l'utilisateur pour correspondre à la structure attendue
    const formattedUser = {
      id: rawUser._id,
      name: rawUser.name,
      username: rawUser.username,
      email: rawUser.email,
      role: rawUser.role,
      level: rawUser.level || 'beginner',
      status: rawUser.status,
      jobPosition:
        rawUser.jobPosition === 'Non spécifié'
          ? 'unspecified'
          : rawUser.jobPosition || 'unspecified',
      bio: rawUser.bio || '',
      gender: rawUser.gender || 'male',
      profileImage: rawUser.profileImage || (rawUser.gender === 'female' ? '/images/default_female.png' : '/images/default_male.png'),
      urls: Array.isArray(rawUser.urls) ? rawUser.urls : [],
      createdAt: new Date(rawUser.createdAt),
      updatedAt: new Date(rawUser.updatedAt),
    };


    // Validation des données avec Zod
    const parsedUser = userSchema.safeParse(formattedUser);

    if (!parsedUser.success) {
      console.error('Erreur de validation de l\'utilisateur:', parsedUser.error.format());
      throw new Error('Utilisateur invalide');
    }

    return parsedUser.data; // Retourne l'utilisateur validé

  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur :", error);
    throw new Error('Erreur lors de la récupération de l\'utilisateur');
  }
}

/**
 * Met à jour un utilisateur existant.
 *
 * @param id        Identifiant MongoDB de l’utilisateur à modifier
 * @param payload   Objet partiel contenant UNIQUEMENT les champs à mettre à jour
 *                  (ex. { name: 'Nouveau Nom', bio: 'Nouvelle bio', urls: [...] })
 * @returns         Données utilisateur validées par Zod après mise à jour
 */
export async function updateUser(
  id: string,
  payload: Partial<{
    name: string;
    username: string;
    email: string;
    bio: string;
    urls: { label: string; url: string }[];
    role: 'admin' | 'manager' | 'collaborator';
    status: UserStatus;
    jobPosition:
    | 'fullStackDeveloper'
    | 'frontendDeveloper'
    | 'backendDeveloper'
    | 'unspecified';
    photo?: string;
    gender?: "male" | "female" | "other";
  }>
) {
  if (!id) {
    throw new Error("L'identifiant de l'utilisateur est requis");
  }

  if (!payload || Object.keys(payload).length === 0) {
    throw new Error('Aucune donnée fournie pour la mise à jour');
  }

  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Token d\'authentification manquant');

    // Requête API
    const { data } = await axios.put(`/api/users/update/${id}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!data?.data) throw new Error('Réponse du serveur invalide');

    const rawUser = data.data;

    // Transformation robuste des données
    const formattedUser = {
      id: rawUser._id || rawUser.id,
      name: rawUser.name || '',
      username: rawUser.username || '',
      email: rawUser.email || '',
      bio: rawUser.bio || '',
      urls: Array.isArray(rawUser.urls)
        ? rawUser.urls.filter((url: any) => url.label && url.url)
        : [],
      role: ['admin', 'manager', 'collaborator'].includes(rawUser.role)
        ? rawUser.role
        : 'collaborator',
      status: ['active', 'inactive', 'suspended'].includes(rawUser.status)
        ? rawUser.status
        : 'inactive',
      jobPosition: [
        'fullStackDeveloper',
        'frontendDeveloper',
        'backendDeveloper',
        'unspecified'
      ].includes(rawUser.jobPosition)
        ? rawUser.jobPosition
        : 'unspecified',
      createdAt: rawUser.createdAt ? new Date(rawUser.createdAt) : new Date(),
      updatedAt: rawUser.updatedAt ? new Date(rawUser.updatedAt) : new Date(),
      photo: rawUser.photo || undefined,
      gender: ['male', 'female', 'other'].includes(rawUser.gender)
        ? rawUser.gender
        : undefined,
    };

    console.log('Données formatées avant validation:', formattedUser);

    const parsed = userSchema.safeParse(formattedUser);
    if (!parsed.success) {
      console.error(
        "Erreur de validation:",
        parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      );
      throw new Error("Données utilisateur invalides après mise à jour");
    }

    return parsed.data;
  } catch (err) {
    console.error('Erreur mise à jour utilisateur:', err);
    throw err instanceof Error ? err : new Error('Erreur inconnue');
  }
}

export async function fetchUserStatsLevelInPercentage() {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Token d’authentification manquant');

    const response = await axios.get('/api/users/stats/levels', {
      headers: { authorization: `Bearer ${token}` }
    });

    const stats = response.data?.data as Record<string, number>; // 👈 on précise ici que les valeurs sont des nombres

    if (!stats || typeof stats !== 'object') {
      throw new Error('Données statistiques invalides');
    }

    const total = Object.values(stats).reduce((sum, count) => sum + count, 0); // ✅ plus d'erreur ici

    if (total === 0) {
      throw new Error("Aucun utilisateur trouvé pour calculer les pourcentages");
    }

    // Calcul des pourcentages
    const percentages: Record<string, number> = {};
    for (const [level, count] of Object.entries(stats)) {
      percentages[level] = parseFloat(((count / total) * 100).toFixed(2));
    }

    console.log('Stats niveaux (en %):', percentages);

    return percentages;
  } catch (error) {
    console.error('Erreur lors de la récupération des stats niveaux utilisateurs :', error);
    throw error;
  }
}

// services/users.service.ts
export async function deleteUser(id: string) {
  const res = await fetch(`/api/users/delete/${id}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Erreur lors de la suppression')
  }

  return res.json()
}



