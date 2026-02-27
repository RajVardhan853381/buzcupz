export enum ModifierSelectionType {
    SINGLE = 'SINGLE',
    MULTIPLE = 'MULTIPLE',
}

export enum ModifierDisplayStyle {
    LIST = 'LIST',
    DROPDOWN = 'DROPDOWN',
    BUTTONS = 'BUTTONS',
}

export enum ModifierPriceType {
    FIXED = 'FIXED',
    PERCENTAGE = 'PERCENTAGE',
    REPLACEMENT = 'REPLACEMENT',
    FREE = 'FREE',
    QUANTITY_BASED = 'QUANTITY_BASED',
}

export interface Modifier {
    id: string;
    name: string;
    displayName: string;
    description?: string;

    // Pricing
    priceAdjustment: number;
    priceType: ModifierPriceType;
    percentageValue?: number;

    // Display
    sortOrder: number;
    imageUrl?: string;
    color?: string;

    // Status
    isDefault: boolean;
    isAvailable: boolean;
    isPremium: boolean;
    isPopular: boolean;

    // Quantity
    minQuantity: number;
    maxQuantity: number;
    defaultQuantity: number;
    quantityStep: number;
    pricePerQuantity?: number;
    freeQuantity: number;

    // Inventory
    inventoryItemId?: string;
    deductQuantity?: number;

    // Info
    calories?: number;
    allergens?: string[];

    // Relationships
    groupId: string;
    nestedGroups?: ModifierGroup[];

    createdAt: string;
    updatedAt: string;
}

export interface ModifierGroup {
    id: string;
    name: string;
    displayName: string;
    description?: string;

    // Rules
    selectionType: ModifierSelectionType;
    minSelections: number;
    maxSelections: number;
    isRequired: boolean;

    // Display
    sortOrder: number;
    displayStyle: ModifierDisplayStyle;
    showPrices: boolean;

    // Logic
    defaultModifierId?: string;
    conditionalLogic?: Record<string, any>;

    isActive: boolean;

    // Relationships
    modifiers: Modifier[];
    parentModifierId?: string;

    // Computed
    menuItemsCount?: number;

    createdAt: string;
    updatedAt: string;
}

export interface MenuItemModifierGroup {
    id: string;
    menuItemId: string;
    modifierGroupId: string;
    modifierGroup: ModifierGroup;

    // Overrides
    sortOrder: number;
    isRequired?: boolean;
    minSelections?: number;
    maxSelections?: number;
    priceOverrides?: Record<string, number>;
}

export interface OrderItemModifier {
    id: string;
    modifierId: string;
    modifierName: string;
    groupName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    nestedModifiers?: any; // Recursive structure
}

// ==========================================
// DTO Interfaces
// ==========================================

export interface CreateModifierDto {
    name: string;
    displayName?: string;
    description?: string;
    priceAdjustment?: number;
    priceType?: ModifierPriceType | string;
    percentageValue?: number;
    sortOrder?: number;
    imageUrl?: string;
    color?: string;
    isDefault?: boolean;
    isAvailable?: boolean;
    isPremium?: boolean;
    isPopular?: boolean;
    minQuantity?: number;
    maxQuantity?: number;
    defaultQuantity?: number;
    quantityStep?: number;
    pricePerQuantity?: number;
    freeQuantity?: number;
    inventoryItemId?: string;
    deductQuantity?: number;
    calories?: number;
    allergens?: string[];
}

export interface UpdateModifierDto extends Partial<CreateModifierDto> { }

export interface CreateModifierGroupDto {
    name: string;
    displayName: string;
    description?: string;
    selectionType: ModifierSelectionType;
    minSelections?: number;
    maxSelections?: number;
    isRequired?: boolean;
    sortOrder?: number;
    displayStyle?: ModifierDisplayStyle;
    showPrices?: boolean;
    defaultModifierId?: string;
    conditionalLogic?: Record<string, any>;
    isActive?: boolean;
    parentModifierId?: string;
    modifiers?: CreateModifierDto[];
}

export interface UpdateModifierGroupDto extends Partial<Omit<CreateModifierGroupDto, 'modifiers'>> { }

export interface ModifierGroupQueryDto {
    search?: string;
    isActive?: boolean;
    selectionType?: ModifierSelectionType;
    includeModifiers?: boolean;
    includeMenuItemsCount?: boolean;
}

export interface AssignModifierGroupDto {
    modifierGroupId: string;
    sortOrder?: number;
    isRequired?: boolean;
    minSelections?: number;
    maxSelections?: number;
    priceOverrides?: Record<string, number>;
}

export interface AssignModifierGroupsDto {
    groups: AssignModifierGroupDto[];
}
