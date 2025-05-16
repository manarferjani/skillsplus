import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

// Create an axios instance with default configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const auth = useAuthStore.getState().auth;
    const token = localStorage.getItem("token")
    if (auth.accessToken) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const auth = useAuthStore.getState().auth;

    // If the error is 401 and we haven't tried to refresh the token yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      auth.refreshToken
    ) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/api/auth/refresh-token`,
          {
            refreshToken: auth.refreshToken,
          }
        );

        // If we got a new token, update the auth store and retry the request
        if (response.data.token) {
          auth.setAccessToken(response.data.token);
          originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, reset auth state and reject the promise
        auth.reset();
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
  
  signUp: async (name: string, email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/signup', { name, email, password });
      return response.data;
    } catch (error: any) {
      console.error('Sign-up API error:', error);
      // Return a formatted error object instead of throwing
      return {
        success: false,
        message: error.response?.data?.message || 
                 `Registration failed: ${error.message || 'Server unreachable'}`
      };
    }
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
  
  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/api/auth/forgot-password', { email });
    return response.data;
  },
  
  resetPassword: async (resetToken: string, newPassword: string) => {
    const response = await apiClient.post('/api/auth/reset-password', {
      resetToken,
      newPassword
    });
    return response.data;
  }
}; 