import api from '@/lib/api';

export interface CreateInventoryItemDto {
  name: string;
  sku?: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  costPerUnit: number;
}

export const inventoryService = {
  // Get all inventory items
  getInventoryItems: async () => {
    const response = await api.get('/inventory');
    return response.data;
  },

  // Get inventory item by ID
  getInventoryItemById: async (id: string) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },

  // Create inventory item
  createInventoryItem: async (data: CreateInventoryItemDto) => {
    const response = await api.post('/inventory', data);
    return response.data;
  },

  // Update inventory item
  updateInventoryItem: async (id: string, data: Partial<CreateInventoryItemDto>) => {
    const response = await api.patch(`/inventory/${id}`, data);
    return response.data;
  },

  // Adjust stock
  adjustStock: async (id: string, quantity: number, reason: string) => {
    const response = await api.post(`/inventory/${id}/adjust`, {
      quantity,
      reason,
    });
    return response.data;
  },

  // Get low stock items
  getLowStockItems: async () => {
    const response = await api.get('/inventory/low-stock');
    return response.data;
  },
};
