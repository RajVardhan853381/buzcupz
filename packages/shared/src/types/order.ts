
// ============================================
// ENUMS
// ============================================

export enum OrderType {
    DINE_IN = 'DINE_IN',
    TAKEOUT = 'TAKEOUT',
    DELIVERY = 'DELIVERY',
    PICKUP = 'PICKUP',
}

export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    PREPARING = 'PREPARING',
    READY = 'READY',
    SERVED = 'SERVED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export enum OrderItemStatus {
    PENDING = 'PENDING',
    SENT_TO_KITCHEN = 'SENT_TO_KITCHEN',
    PREPARING = 'PREPARING',
    READY = 'READY',
    SERVED = 'SERVED',
    VOIDED = 'VOIDED',
}

export enum PaymentStatus {
    UNPAID = 'UNPAID',
    PARTIALLY_PAID = 'PARTIALLY_PAID',
    PAID = 'PAID',
    REFUNDED = 'REFUNDED',
}

// ============================================
// CART TYPES (for order creation)
// ============================================

export interface CartModifierSelection {
    modifierId: string;
    modifierName: string;
    groupId: string;
    groupName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface CartItem {
    id: string; // Temporary cart ID
    menuItemId: string;
    menuItem: {
        id: string;
        name: string;
        imageUrl?: string;
        basePrice: number;
    };
    quantity: number;
    unitPrice: number;
    modifiers: CartModifierSelection[];
    modifiersPrice: number;
    itemTotal: number;
    specialInstructions?: string;
    courseNumber?: number;
}

export interface Cart {
    items: CartItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    discountAmount: number;
    discountCode?: string;
    tipAmount: number;
    total: number;
}

// ============================================
// ORDER TYPES
// ============================================

export interface OrderItemModifier {
    id: string;
    modifierId: string;
    modifierName: string;
    groupName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface OrderItem {
    id: string;
    menuItemId: string;
    itemName: string;
    itemDescription?: string;
    quantity: number;
    unitPrice: number;
    modifiersPrice: number;
    itemTotal: number;
    modifiers: OrderItemModifier[];
    modifiersSummary?: string;
    status: OrderItemStatus;
    specialInstructions?: string;
    kitchenNote?: string;
    courseNumber: number;
    firedAt?: string;
    completedAt?: string;
    isVoided: boolean;
    voidReason?: string;
}

export interface Order {
    id: string;
    orderNumber: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    tableId?: string;
    table?: {
        id: string;
        name: string;
        section?: string;
    };
    orderType: OrderType;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    items: OrderItem[];
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    tipAmount: number;
    totalAmount: number;
    notes?: string;
    kitchenNotes?: string;
    placedAt: string;
    confirmedAt?: string;
    completedAt?: string;
    paidAt?: string;
    paymentMethod?: string;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// CREATE ORDER REQUEST
// ============================================

export interface CreateOrderItemModifierRequest {
    modifierId: string;
    quantity?: number;
}

export interface CreateOrderItemRequest {
    menuItemId: string;
    quantity: number;
    modifiers?: CreateOrderItemModifierRequest[];
    specialInstructions?: string;
    courseNumber?: number;
}

export interface CreateOrderRequest {
    orderType: OrderType;
    tableId?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    items: CreateOrderItemRequest[];
    notes?: string;
    discountCode?: string;
    tipAmount?: number;
}

// ============================================
// MODIFIER VALIDATION
// ============================================

export interface ModifierValidationError {
    groupId: string;
    groupName: string;
    message: string;
    type: 'required' | 'min' | 'max';
}

export interface ModifierValidationResult {
    isValid: boolean;
    errors: ModifierValidationError[];
}
