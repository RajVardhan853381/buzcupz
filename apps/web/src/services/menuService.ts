import api from '@/lib/api';

export interface CreateMenuItemDto {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  image?: string;
  isAvailable?: boolean;
}

export const menuService = {
  // Get all menu items
  getMenuItems: async (categoryId?: string) => {
    const response = await api.get('/menu/items', {
      params: categoryId ? { categoryId } : {},
    });
    return response.data;
  },

  // Get menu item by ID
  getMenuItemById: async (id: string) => {
    const response = await api.get(`/menu/items/${id}`);
    return response.data;
  },

  // Create menu item
  createMenuItem: async (data: CreateMenuItemDto) => {
    const response = await api.post('/menu/items', data);
    return response.data;
  },

  // Update menu item
  updateMenuItem: async (id: string, data: Partial<CreateMenuItemDto>) => {
    const response = await api.patch(`/menu/items/${id}`, data);
    return response.data;
  },

  // Delete menu item
  deleteMenuItem: async (id: string) => {
    const response = await api.delete(`/menu/items/${id}`);
    return response.data;
  },

  // Get categories
  getCategories: async () => {
    const response = await api.get('/menu/categories');
    return response.data;
  },

  // Create category
  createCategory: async (name: string, description?: string) => {
    const response = await api.post('/menu/categories', { name, description });
    return response.data;
  },
};
