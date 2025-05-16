import axios from "axios";
import { userListSchema, userSchema } from '../features/users/data/schema';


export async function fetchUsers() {
  try {
    const token= localStorage.getItem('token')
    const response = await axios.get('/api/users/getallUsers',{
      headers : {authorization :`Bearer ${token}`}
    });

    console.log("Données utilisateurs reçues:", response.data);

    const rawUsers = response.data.data;

    const formattedUsers = rawUsers.map((user: any) => ({
      id: user._id,
      name : user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status, // ou récupéré d’une autre propriété
      jobPosition: user.jobPosition === 'Non spécifié' 
        ? 'unspecified' 
        : user.jobPosition || 'unspecified', // Fallback
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    }));

    
   
    const validatedData = userListSchema.parse(formattedUsers);

    return validatedData;
  } catch (error) {
    console.error("Erreur lors de la récupération ou validation des utilisateurs :", error);
    throw error;
  }
}
export async function addUserWithEmail(userData: { 
  name: string,
  email: string;
  password: string;
  role: string;
  
}) {
  try {
    console.log('Données envoyées à l\'API:', userData);
    const token = localStorage.getItem('token');
    const response = await axios.post('/api/users/addWithEmail', userData, {
      headers: { authorization: `Bearer ${token}` }
    });

    console.log("Nouvel utilisateur créé avec succès :", response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur avec email :", error);
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
      status: rawUser.status,
      jobPosition:
        rawUser.jobPosition === 'Non spécifié'
          ? 'unspecified'
          : rawUser.jobPosition || 'unspecified',
      createdAt: new Date(rawUser.createdAt),
      updatedAt: new Date(rawUser.updatedAt),
      photo: rawUser.photo,
    };

    // Validation des données avec Zod
    const parsedUser = userSchema.safeParse(formattedUser);

    if (!parsedUser.success) {
      console.error('Erreur de validation de l\'utilisateur:', parsedUser.error.errors);
      throw new Error('Utilisateur invalide');
    }

    return parsedUser.data; // Retourne l'utilisateur validé

  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur :", error);
    throw new Error('Erreur lors de la récupération de l\'utilisateur');
  }
}
