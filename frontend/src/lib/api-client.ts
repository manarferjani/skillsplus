import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { log } from 'console';
import { useNavigate } from 'react-router-dom';

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



const apiClient = axios.create({
  baseURL: "http://localhost:5000",
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth tokens
      localStorage.removeItem("token");
      // Redirect to login
      window.location.href = "/sign-in";
    }
    return Promise.reject(error);
  }
);

export default apiClient

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