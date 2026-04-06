import api from './axios';

export const mealService = {
  registerMeal: async (studentId: string) => {
    const response = await api.post('/meals', { studentId });
    return response.data;
  },

  getMealHistory: async (studentId?: string, startDate?: string, endDate?: string) => {
    const response = await api.get('/meals/history', { params: { studentId, startDate, endDate } });
    return response.data;
  },

  getTodayAttendance: async () => {
    const response = await api.get('/meals/today');
    return response.data;
  },
};

export const paymentService = {
  createPayment: async (data: { studentId: string; amount: number; comprobantePath?: string }) => {
    const response = await api.post('/payments', data);
    return response.data;
  },

  uploadComprobante: async (formData: FormData) => {
    const response = await api.post('/payments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getPayments: async (studentId?: string, isVerified?: boolean, page = 1, limit = 10) => {
    const response = await api.get('/payments', { params: { studentId, isVerified, page, limit } });
    return response.data;
  },

  verifyPayment: async (id: string) => {
    const response = await api.patch(`/payments/${id}/verify`);
    return response.data;
  },

  calculateMeals: async (amount: number) => {
    const response = await api.post('/payments/calculate', { amount });
    return response.data;
  },
};

export const ratingService = {
  createRating: async (data: { stars: number; comment?: string }) => {
    const response = await api.post('/ratings', data);
    return response.data;
  },

  getRatings: async () => {
    const response = await api.get('/ratings');
    return response.data;
  },

  getAverageRating: async () => {
    const response = await api.get('/ratings/average');
    return response.data;
  },
};

export const complaintService = {
  createComplaint: async (data: { type: string; content: string; isAnonymous: boolean }) => {
    const response = await api.post('/complaints', data);
    return response.data;
  },

  getComplaints: async (type?: string, isResolved?: boolean, page = 1, limit = 10) => {
    const response = await api.get('/complaints', { params: { type, isResolved, page, limit } });
    return response.data;
  },

  respondComplaint: async (id: string, response: string) => {
    const res = await api.post(`/complaints/${id}/respond`, { response });
    return res.data;
  },
};

export const newsService = {
  getNews: async () => {
    const response = await api.get('/news');
    return response.data;
  },

  getNewsById: async (id: string) => {
    const response = await api.get(`/news/${id}`);
    return response.data;
  },

  createNews: async (data: { title: string; content: string; imageUrl?: string }) => {
    const response = await api.post('/news', data);
    return response.data;
  },

  updateNews: async (id: string, data: any) => {
    const response = await api.put(`/news/${id}`, data);
    return response.data;
  },

  deleteNews: async (id: string) => {
    const response = await api.delete(`/news/${id}`);
    return response.data;
  },
};
