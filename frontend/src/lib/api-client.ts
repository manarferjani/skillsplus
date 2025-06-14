import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

console.log("API URL utilisée:", import.meta.env.VITE_API_URL);

// Définition du type pour les données signup
type SignUpData = {
  name: string;
  email: string;
  password: string;
  role?: string;
  gender?: string;
  jobPosition?: string;
};


// Create an axios instance with default configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 180000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const { auth } = useAuthStore.getState();
    const localStorageToken = localStorage.getItem("token");

    // Cas 1: Token dans le store → prioritaire
    if (auth.accessToken) {
      config.headers['Authorization'] = `Bearer ${auth.accessToken}`;

      // Mise à jour du localStorage si nécessaire
      if (!localStorageToken || localStorageToken !== auth.accessToken) {
        localStorage.setItem("token", auth.accessToken);
      }
      return config;
    }

    // Cas 2: Seul le localStorage a un token
    if (localStorageToken) {
      config.headers['Authorization'] = `Bearer ${localStorageToken}`;

      // Optionnel: Mettre à jour le store si besoin
      // useAuthStore.getState().auth.setAccessToken(localStorageToken);
      return config;
    }

    // Cas 3: Aucun token disponible
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const { auth } = useAuthStore.getState(); // Destructuration pour plus de clarté

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const currentRefreshToken = auth.refreshToken || localStorage.getItem('refreshToken');

      if (!currentRefreshToken) {
        auth.reset();
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await apiClient.post('/api/auth/refresh-token', {
          refreshToken: currentRefreshToken
        });

        const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;

        // Utilisation des méthodes existantes du store
        auth.setAccessToken(newAccessToken); // Met à jour le store et les cookies
        auth.setRefreshToken(newRefreshToken); // Met à jour le store et les cookies
        
        // Mise à jour supplémentaire du localStorage si nécessaire
        localStorage.setItem('token', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        console.error('Échec du rafraîchissement:', refreshError);
        auth.reset();
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login?session_expired=true';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Helper functions for common API operations
export const authAPI = {
  signIn: async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/signin', { email, password });
      return response.data;
    } catch (error: any) {
      console.error('Sign-in API error:', error);
      // Return a formatted error object instead of throwing
      return {
        success: false,
        message: error.response?.data?.message ||
          `Authentication failed: ${error.message || 'Server unreachable'}`
      };
    }
  },

  signUp: async (data: SignUpData) => {
    try {
      const response = await apiClient.post('/api/auth/signup', data);
      return response.data;
    } catch (error: any) {
      console.error('Sign-up API error:', error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          `Registration failed: ${error.message || 'Server unreachable'}`,
      };
    }
  },

  logout: async () => {
    const authStore = useAuthStore.getState(); // Récupère le store complet
    const auth = authStore.auth; // Accède à l'objet auth

    try {
      await apiClient.post('/api/auth/logout', {
        refreshToken: auth.refreshToken,
      });
    } catch (error) {
      console.warn("Erreur lors de la déconnexion backend:", error);
    }

    authStore.auth.reset(); // Réinitialisation correcte
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    //window.location.href = '/login';
  },

  getProfile: async () => {
    const response = await apiClient.get('/api/auth/profile');
    return response.data;
  },

  updateProfile: async (profileData: { name?: string }) => {
    const response = await apiClient.put('/api/auth/profile', profileData);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.post('/api/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiClient.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      console.error('Forgot password API error:', error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          `Failed to send reset email: ${error.message || 'Server unreachable'}`,
      };
    }
  },

  resetPassword: async (resetToken: string, newPassword: string) => {
    const response = await apiClient.post('/api/auth/reset-password', {
      resetToken,
      newPassword
    });
    return response.data;
  }

}; 