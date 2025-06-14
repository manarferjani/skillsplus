export interface User {
    id: string;     // L'ID de l'utilisateur (généralement un ObjectId MongoDB sous forme de chaîne)
    name: string;   // Le nom de l'utilisateur
    email: string;  // L'email de l'utilisateur
    role: string;   // Le rôle de l'utilisateur (par exemple : 'admin', 'manager', 'collaborator')
  }

export interface SignInResponse {
    success: boolean;       // Indique si la connexion a réussi
    token: string;          // Le token d'accès généré pour l'utilisateur
    refreshToken: string;   // Le token de rafraîchissement
    user: User;             // L'objet de l'utilisateur avec ses informations
    message?: string;       // Message d'erreur ou de succès (facultatif)
  }
  
  