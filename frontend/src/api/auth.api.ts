import api from './axios';

export interface User {
  id: string;
  email: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    // Backend uses OAuth2PasswordRequestForm which requires x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append('username', email); // OAuth2 expects username
    formData.append('password', password);
    
    const response = await api.post('/api/v1/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  register: async (email: string, password: string): Promise<User> => {
    const response = await api.post('/api/v1/auth/register', { email, username: email.split('@')[0], password });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/api/v1/users/me');
    return response.data;
  },
};
