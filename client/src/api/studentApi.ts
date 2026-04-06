import api from './axios';

export const studentService = {
  getStudents: async (search?: string, page = 1, limit = 10) => {
    const response = await api.get('/students', { params: { search, page, limit } });
    return response.data;
  },

  getStudentById: async (id: string) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  searchStudents: async (params: { cedula?: string; nombre?: string; apellido?: string; carrera?: string; dia?: string }) => {
    const response = await api.get('/students/search', { params });
    return response.data;
  },

  getAvailableMeals: async (studentId: string) => {
    const response = await api.get(`/students/${studentId}/available-meals`);
    return response.data;
  },

  createStudent: async (data: any) => {
    const response = await api.post('/students', data);
    return response.data;
  },

  updateStudent: async (id: string, data: any) => {
    const response = await api.put(`/students/${id}`, data);
    return response.data;
  },

  deleteStudent: async (id: string) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },

  importStudents: async (formData: FormData) => {
    const response = await api.post('/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  validateSisben: async (id: string, data: { cedula: string; name: string; lastName: string }) => {
    const response = await api.post(`/students/${id}/validate-sisben`, data);
    return response.data;
  },
};
