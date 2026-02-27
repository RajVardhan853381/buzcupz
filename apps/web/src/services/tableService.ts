import api from '@/lib/api';

export interface CreateTableDto {
  number: string;
  capacity: number;
  floorId: string;
  position?: { x: number; y: number };
}

export const tableService = {
  // Get all tables
  getTables: async (floorId?: string) => {
    const response = await api.get('/tables', {
      params: floorId ? { floorId } : {},
    });
    return response.data;
  },

  // Get table by ID
  getTableById: async (id: string) => {
    const response = await api.get(`/tables/${id}`);
    return response.data;
  },

  // Create table
  createTable: async (data: CreateTableDto) => {
    const response = await api.post('/tables', data);
    return response.data;
  },

  // Update table status
  updateTableStatus: async (id: string, status: string) => {
    const response = await api.patch(`/tables/${id}/status`, { status });
    return response.data;
  },

  // Get floors
  getFloors: async () => {
    const response = await api.get('/floors');
    return response.data;
  },
};
