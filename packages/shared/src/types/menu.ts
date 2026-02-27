
// ==========================================
// Menu Item Types
// ==========================================

import { MenuItemModifierGroup } from './modifiers';

export interface Category {
    id: string;
    name: string;
    description?: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface MenuItem {
    id: string;
    name: string;
    description?: string;
    shortDescription?: string;
    basePrice: number;
    categoryId: string;
    category?: Category;
    imageUrl?: string;
    isAvailable: boolean;
    isPopular: boolean;
    isSpicy: boolean;
    isVegan: boolean;
    isVegetarian: boolean;
    isGlutenFree: boolean;
    isFeatured?: boolean;
    isNewItem?: boolean;
    preparationTime?: number;
    calories?: number;
    allergens?: string[];
    modifierGroups?: MenuItemModifierGroup[];
    compareAtPrice?: number;
    createdAt: string;
    updatedAt: string;
}
