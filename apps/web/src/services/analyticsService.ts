import api from '@/lib/api';

export const analyticsService = {
  // Get dashboard overview
  getDashboard: async (startDate?: string, endDate?: string) => {
    const response = await api.get('/analytics/dashboard', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Get revenue analytics
  getRevenue: async (period: 'day' | 'week' | 'month' | 'year') => {
    const response = await api.get('/analytics/revenue', {
      params: { period },
    });
    return response.data;
  },

  // Get best sellers
  getBestSellers: async (limit: number = 10) => {
    const response = await api.get('/analytics/best-sellers', {
      params: { limit },
    });
    return response.data;
  },

  // Get sales by category
  getSalesByCategory: async (startDate?: string, endDate?: string) => {
    const response = await api.get('/analytics/sales-by-category', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Get profit margins
  getProfitMargins: async () => {
    const response = await api.get('/analytics/profit-margins');
    return response.data;
  },
};
