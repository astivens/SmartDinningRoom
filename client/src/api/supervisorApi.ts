import api from './axios';

export const supervisorService = {
  getSupervisors: async () => {
    const response = await api.get('/supervisors');
    return response.data;
  },

  createSupervisor: async (data: { email: string; name: string; lastName: string }) => {
    const response = await api.post('/supervisors', data);
    return response.data;
  },

  updateSupervisor: async (id: string, data: any) => {
    const response = await api.put(`/supervisors/${id}`, data);
    return response.data;
  },

  toggleSupervisorStatus: async (id: string, isActive: boolean, isAuthorized: boolean) => {
    const response = await api.patch(`/supervisors/${id}/status`, { isActive, isAuthorized });
    return response.data;
  },

  deleteSupervisor: async (id: string) => {
    const response = await api.delete(`/supervisors/${id}`);
    return response.data;
  },

  getSupervisorLogs: async (page = 1, limit = 50) => {
    const response = await api.get('/supervisors/logs', { params: { page, limit } });
    return response.data;
  },

  generateInviteLink: async () => {
    const response = await api.post('/supervisors/invite');
    return response.data;
  },

  joinWithInvite: async (data: { token: string; email: string; name: string; lastName: string; password: string }) => {
    const response = await api.post('/supervisors/join', data);
    return response.data;
  },

  assignStudent: async (supervisorId: string, studentId: string) => {
    const response = await api.post('/supervisors/assignments', { supervisorId, studentId });
    return response.data;
  },

  removeStudentAssignment: async (supervisorId: string, studentId: string) => {
    const response = await api.delete(`/supervisors/${supervisorId}/students/${studentId}`);
    return response.data;
  },

  getSupervisorStudents: async (supervisorId: string) => {
    const response = await api.get(`/supervisors/${supervisorId}/students`);
    return response.data;
  },
};
