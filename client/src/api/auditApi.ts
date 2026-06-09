import api from './axios';

export const auditService = {
  getLogs: async (
    page = 1,
    limit = 50,
    filters?: {
      action?: string;
      method?: string;
      statusCode?: string;
      path?: string;
      role?: string;
      startDate?: string;
      endDate?: string;
    }
  ) => {
    const response = await api.get('/audit', { params: { page, limit, ...filters } });
    return response.data;
  },
};
