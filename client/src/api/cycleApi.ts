import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Cycle {
  id: string;
  uid?: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Activo' | 'Cerrado';
  createdAt?: string;
  updatedAt?: string;
}

export const cycleApi = {
  getAll: async (): Promise<Cycle[]> => {
    const response = await axios.get(`${API_URL}/cycles`);
    return response.data;
  },

  getById: async (id: string): Promise<Cycle> => {
    const response = await axios.get(`${API_URL}/cycles/${id}`);
    return response.data;
  },

  create: async (cycle: Omit<Cycle, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Cycle> => {
    const response = await axios.post(`${API_URL}/cycles`, cycle);
    return response.data;
  },

  close: async (id: string): Promise<Cycle> => {
    const response = await axios.patch(`${API_URL}/cycles/${id}/close`);
    return response.data;
  }
};
