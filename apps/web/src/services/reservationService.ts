import api from '@/lib/api';

export interface CreateReservationDto {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize: number;
  date: string;
  time: string;
  tableId?: string;
  notes?: string;
}

export const reservationService = {
  // Get all reservations
  getReservations: async (params?: {
    date?: string;
    status?: string;
  }) => {
    const response = await api.get('/reservations', { params });
    return response.data;
  },

  // Get reservation by ID
  getReservationById: async (id: string) => {
    const response = await api.get(`/reservations/${id}`);
    return response.data;
  },

  // Create reservation
  createReservation: async (data: CreateReservationDto) => {
    const response = await api.post('/reservations', data);
    return response.data;
  },

  // Update reservation status
  updateReservationStatus: async (id: string, status: string) => {
    const response = await api.patch(`/reservations/${id}/status`, { status });
    return response.data;
  },

  // Check availability
  checkAvailability: async (date: string, time: string, partySize: number) => {
    const response = await api.get('/reservations/availability', {
      params: { date, time, partySize },
    });
    return response.data;
  },
};
