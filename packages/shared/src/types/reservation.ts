export enum ReservationStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    WAITLIST = 'WAITLIST',
    SEATED = 'SEATED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW',
}

export enum ReservationSource {
    WALK_IN = 'WALK_IN',
    PHONE = 'PHONE',
    WEBSITE = 'WEBSITE',
    APP = 'APP',
    THIRD_PARTY = 'THIRD_PARTY',
    SOCIAL = 'SOCIAL',
    EMAIL = 'EMAIL',
}

export enum CelebrationType {
    BIRTHDAY = 'BIRTHDAY',
    ANNIVERSARY = 'ANNIVERSARY',
    ENGAGEMENT = 'ENGAGEMENT',
    GRADUATION = 'GRADUATION',
    BUSINESS = 'BUSINESS',
    DATE_NIGHT = 'DATE_NIGHT',
    OTHER = 'OTHER',
}

export enum SeatingPreference {
    INDOOR = 'INDOOR',
    OUTDOOR = 'OUTDOOR',
    BAR = 'BAR',
    PRIVATE = 'PRIVATE',
    WINDOW = 'WINDOW',
    QUIET = 'QUIET',
    NO_PREFERENCE = 'NO_PREFERENCE',
}

export interface Table {
    id: string;
    name: string;
    number?: string;
    minCapacity: number;
    maxCapacity: number;
    section?: string;
    floor: number;
    positionX?: number;
    positionY?: number;
    width?: number;
    height?: number;
    shape: 'RECTANGLE' | 'ROUND' | 'SQUARE' | 'BOOTH' | 'BAR' | 'CUSTOM';
    status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'OUT_OF_SERVICE';
    isActive: boolean;
    features: string[];
}

export interface Guest {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    isVIP: boolean;
    totalVisits: number;
    dietaryRestrictions: string[];
    birthday?: string;
    anniversary?: string;
    notes?: string;
}

export interface Reservation {
    id: string;
    guestName: string;
    guestEmail?: string;
    guestPhone?: string;
    partySize: number;
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    status: ReservationStatus;
    source: ReservationSource;
    tableId?: string;
    table?: Table;
    guestId?: string;
    guest?: Guest;
    isVIP: boolean;
    isFirstVisit: boolean;
    celebrationType?: CelebrationType;
    celebrationNote?: string;
    dietaryNotes?: string;
    seatingPreference?: SeatingPreference;
    specialRequests?: string;
    internalNotes?: string;
    confirmationCode?: string;
    confirmedAt?: string;
    seatedAt?: string;
    completedAt?: string;
    cancelledAt?: string;
    cancelReason?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TimeSlot {
    time: string;
    available: boolean;
    availableTables: number;
    tableIds: string[];
}

export interface CalendarDay {
    date: string;
    totalReservations: number;
    totalGuests: number;
    confirmedCount: number;
    pendingCount: number;
    waitlistCount: number;
    isPeakDay: boolean;
}

export interface DaySchedule {
    date: string;
    schedule: {
        table: Table;
        reservations: Reservation[];
    }[];
    unassigned: Reservation[];
    hourlyStats: {
        hour: number;
        label: string;
        reservationCount: number;
        guestCount: number;
    }[];
    summary: {
        totalReservations: number;
        totalGuests: number;
        confirmedCount: number;
        seatedCount: number;
        pendingCount: number;
    };
}

export interface CreateReservationRequest {
    guestName: string;
    guestEmail?: string;
    guestPhone?: string;
    partySize: number;
    date: string;
    startTime: string;
    duration?: number;
    tableId?: string;
    source?: ReservationSource;
    celebrationType?: CelebrationType;
    celebrationNote?: string;
    dietaryNotes?: string;
    seatingPreference?: SeatingPreference;
    specialRequests?: string;
    isVIP?: boolean;
    guestId?: string;
}

export interface UpdateReservationRequest extends Partial<CreateReservationRequest> {
    status?: ReservationStatus;
    internalNotes?: string;
    cancelReason?: string;
}

export interface RescheduleRequest {
    date: string;
    startTime: string;
    tableId?: string;
    reason?: string;
}

export interface ReservationFilters {
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: ReservationStatus[];
    tableId?: string;
    search?: string;
    view?: 'day' | 'week' | 'month';
    page?: number;
    limit?: number;
}
