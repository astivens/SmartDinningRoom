import api from './axios';
import { AuthResponse, User } from '../types';

export interface LoginData {
  email: string;
  password: string;
  role: 'admin' | 'supervisor' | 'student';
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  lastName: string;
  cedula: string;
  carrera: string;
  semestre: number;
  categoriaSisben: string;
  archivoSisben?: File | null;
  direccion?: string;
  barrio: string;
  telefono: string;
  trabaja: boolean;
  etnia: string;
  desplazado: boolean;
  trabajadorUniversitario: boolean;
  diasComedor: string[];
}

export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const formData = new FormData();
    (Object.keys(data) as (keyof RegisterData)[]).forEach((key) => {
      const value = data[key];
      if (key === 'archivoSisben') {
        if (value instanceof File) formData.append('archivoSisben', value);
      } else if (key === 'diasComedor') {
        formData.append('diasComedor', JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    const response = await api.post('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  setupTwoFactor: async (): Promise<{ qrCode: string; secret: string; message: string }> => {
    const response = await api.post('/auth/setup-2fa');
    return response.data;
  },

  verifyTwoFactor: async (token: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/verify-2fa', { token });
    return response.data;
  },

  getProfile: async (): Promise<{ user: User & { student?: any } }> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<any> => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<any> => {
    const response = await api.put('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};
