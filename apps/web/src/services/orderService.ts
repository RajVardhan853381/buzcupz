import api from '@/lib/api';

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  notes?: string;
  modifiers?: string[];
}

export interface CreateOrderDto {
  tableId?: string;
  items: OrderItem[];
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
}

export const orderService = {
  // Get all orders
  getOrders: async (params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  // Get order by ID
  getOrderById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Create new order
  createOrder: async (data: CreateOrderDto) => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (id: string, status: string) => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },

  // Get today's orders
  getTodayOrders: async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await api.get('/orders', {
      params: { startDate: today },
    });
    return response.data;
  },
};
