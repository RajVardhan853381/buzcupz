import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { AssignModifierGroupsDto, AssignModifierGroupDto } from './dto/modifier-group.dto';

@Injectable()
export class MenuService {
    constructor(private readonly prisma: PrismaService) { }

    // ============================================
    // MENU ITEMS
    // ============================================

    async findAllItems(restaurantId: string) {
        const items = await this.prisma.menuItem.findMany({
            where: { restaurantId, isActive: true },
            include: {
                category: { select: { id: true, name: true } },
                modifierGroups: {
                    include: {
                        modifierGroup: {
                            include: {
                                modifiers: {
                                    orderBy: { sortOrder: 'asc' },
                                }
                            }
                        }
                    },
                    orderBy: { sortOrder: 'asc' }
                }
            },
            orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
        });
        return { data: items };
    }

    async findItemById(id: string, restaurantId: string) {
        const item = await this.prisma.menuItem.findFirst({
            where: { id, restaurantId },
            include: {
                category: true,
                modifierGroups: {
                    include: {
                        modifierGroup: {
                            include: { modifiers: true }
                        }
                    },
                    orderBy: { sortOrder: 'asc' }
                },
                ingredients: {
                    include: { inventoryItem: true },
                },
            },
        });

        if (!item) {
            throw new NotFoundException('Menu item not found');
        }

        return item;
    }

    async createItem(dto: CreateMenuItemDto, restaurantId: string) {
        // Check if category exists
        const category = await this.prisma.category.findFirst({
            where: { id: dto.categoryId, restaurantId },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        const item = await this.prisma.menuItem.create({
            data: {
                name: dto.name,
                description: dto.description,
                price: dto.price,
                costPrice: dto.costPrice,
                image: dto.image,
                preparationTime: dto.preparationTime || 15,
                isVegetarian: dto.isVegetarian || false,
                isVegan: dto.isVegan || false,
                isGlutenFree: dto.isGlutenFree || false,
                isSpicy: dto.isSpicy || false,
                spiceLevel: dto.spiceLevel || 0,
                isAvailable: dto.isAvailable ?? true,
                isFeatured: dto.isFeatured || false,
                categoryId: dto.categoryId,
                restaurantId,
            },
            include: {
                category: { select: { id: true, name: true } },
            },
        });

        return item;
    }

    async updateItem(id: string, dto: UpdateMenuItemDto, restaurantId: string) {
        const existing = await this.prisma.menuItem.findFirst({
            where: { id, restaurantId },
        });

        if (!existing) {
            throw new NotFoundException('Menu item not found');
        }

        // If changing category, verify it exists
        if (dto.categoryId) {
            const category = await this.prisma.category.findFirst({
                where: { id: dto.categoryId, restaurantId },
            });
            if (!category) {
                throw new NotFoundException('Category not found');
            }
        }

        const item = await this.prisma.menuItem.update({
            where: { id },
            data: dto,
            include: {
                category: { select: { id: true, name: true } },
            },
        });

        return item;
    }

    async deleteItem(id: string, restaurantId: string) {
        const existing = await this.prisma.menuItem.findFirst({
            where: { id, restaurantId },
        });

        if (!existing) {
            throw new NotFoundException('Menu item not found');
        }

        // Soft delete by setting isActive to false
        await this.prisma.menuItem.update({
            where: { id },
            data: { isActive: false },
        });

        return { message: 'Menu item deleted successfully' };
    }

    async toggleAvailability(id: string, isAvailable: boolean, restaurantId: string) {
        const existing = await this.prisma.menuItem.findFirst({
            where: { id, restaurantId },
        });

        if (!existing) {
            throw new NotFoundException('Menu item not found');
        }

        const item = await this.prisma.menuItem.update({
            where: { id },
            data: { isAvailable },
            include: {
                category: { select: { id: true, name: true } },
            },
        });

        return item;
    }

    // ============================================
    // CATEGORIES
    // ============================================

    async findAllCategories(restaurantId: string) {
        const categories = await this.prisma.category.findMany({
            where: { restaurantId, isActive: true },
            include: {
                menuItems: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });
        return { data: categories };
    }

    async findCategoryById(id: string, restaurantId: string) {
        const category = await this.prisma.category.findFirst({
            where: { id, restaurantId },
            include: {
                menuItems: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    async createCategory(dto: CreateCategoryDto, restaurantId: string) {
        // Check for duplicate name
        const existing = await this.prisma.category.findFirst({
            where: { restaurantId, name: dto.name },
        });

        if (existing) {
            throw new ConflictException('Category with this name already exists');
        }

        // Get max sort order
        const maxOrder = await this.prisma.category.aggregate({
            where: { restaurantId },
            _max: { sortOrder: true },
        });

        const category = await this.prisma.category.create({
            data: {
                name: dto.name,
                description: dto.description,
                image: dto.image,
                sortOrder: (maxOrder._max.sortOrder || 0) + 1,
                restaurantId,
            },
        });

        return category;
    }

    async updateCategory(id: string, dto: Partial<CreateCategoryDto>, restaurantId: string) {
        const existing = await this.prisma.category.findFirst({
            where: { id, restaurantId },
        });

        if (!existing) {
            throw new NotFoundException('Category not found');
        }

        // Check for duplicate name if changing name
        if (dto.name && dto.name !== existing.name) {
            const duplicate = await this.prisma.category.findFirst({
                where: { restaurantId, name: dto.name, NOT: { id } },
            });
            if (duplicate) {
                throw new ConflictException('Category with this name already exists');
            }
        }

        const category = await this.prisma.category.update({
            where: { id },
            data: dto,
        });

        return category;
    }

    async deleteCategory(id: string, restaurantId: string) {
        const existing = await this.prisma.category.findFirst({
            where: { id, restaurantId },
            include: { menuItems: { where: { isActive: true } } },
        });

        if (!existing) {
            throw new NotFoundException('Category not found');
        }

        if (existing.menuItems.length > 0) {
            throw new ConflictException('Cannot delete category with active menu items');
        }

        // Soft delete
        await this.prisma.category.update({
            where: { id },
            data: { isActive: false },
        });

        return { message: 'Category deleted successfully' };
    }

    // ============================================
    // MODIFIER ASSIGNMENT (Extension)
    // ============================================

    async assignModifierGroups(menuItemId: string, dto: AssignModifierGroupsDto) {
        // Verify menu item exists
        await this.findItemById(menuItemId, (await this.getRestaurantIdFromItem(menuItemId))); // Optimized check needed normally

        // Delete existing and create new
        await this.prisma.$transaction(async (tx) => {
            await tx.menuItemModifierGroup.deleteMany({ where: { menuItemId } });

            if (dto.groups.length > 0) {
                await tx.menuItemModifierGroup.createMany({
                    data: dto.groups.map((g, i) => ({
                        menuItemId,
                        modifierGroupId: g.modifierGroupId,
                        sortOrder: g.sortOrder ?? i,
                        isRequired: g.isRequired,
                        minSelections: g.minSelections,
                        maxSelections: g.maxSelections,
                        priceOverrides: g.priceOverrides as any,
                    }))
                });
            }
        });

        return this.findOneWithModifiers(menuItemId);
    }

    async addModifierGroup(menuItemId: string, dto: AssignModifierGroupDto) {
        const existing = await this.prisma.menuItemModifierGroup.findUnique({
            where: { menuItemId_modifierGroupId: { menuItemId, modifierGroupId: dto.modifierGroupId } }
        });

        if (existing) throw new BadRequestException('Group already assigned');

        await this.prisma.menuItemModifierGroup.create({
            data: {
                menuItemId,
                modifierGroupId: dto.modifierGroupId,
                sortOrder: dto.sortOrder ?? 0,
                isRequired: dto.isRequired,
                minSelections: dto.minSelections,
                maxSelections: dto.maxSelections,
                priceOverrides: dto.priceOverrides as any
            }
        });

        return this.findOneWithModifiers(menuItemId);
    }

    async removeModifierGroup(menuItemId: string, groupId: string) {
        await this.prisma.menuItemModifierGroup.delete({
            where: { menuItemId_modifierGroupId: { menuItemId, modifierGroupId: groupId } }
        });
        return { message: 'Modifier group removed' };
    }

    async updateModifierGroupAssignment(menuItemId: string, groupId: string, dto: Partial<AssignModifierGroupDto>) {
        await this.prisma.menuItemModifierGroup.update({
            where: { menuItemId_modifierGroupId: { menuItemId, modifierGroupId: groupId } },
            data: {
                sortOrder: dto.sortOrder,
                isRequired: dto.isRequired,
                minSelections: dto.minSelections,
                maxSelections: dto.maxSelections,
                priceOverrides: dto.priceOverrides as any
            }
        });
        return this.findOneWithModifiers(menuItemId);
    }

    async reorderModifierGroups(menuItemId: string, groupIds: string[]) {
        await this.prisma.$transaction(
            groupIds.map((id, idx) =>
                this.prisma.menuItemModifierGroup.update({
                    where: { menuItemId_modifierGroupId: { menuItemId, modifierGroupId: id } },
                    data: { sortOrder: idx }
                })
            )
        );
        return { message: 'Reordered' };
    }

    async copyModifiersFromItem(targetId: string, sourceId: string) {
        const source = await this.prisma.menuItemModifierGroup.findMany({ where: { menuItemId: sourceId } });
        if (source.length === 0) throw new BadRequestException('Source has no modifiers');

        await this.prisma.$transaction([
            this.prisma.menuItemModifierGroup.deleteMany({ where: { menuItemId: targetId } }),
            this.prisma.menuItemModifierGroup.createMany({
                data: source.map(s => ({
                    menuItemId: targetId,
                    modifierGroupId: s.modifierGroupId,
                    sortOrder: s.sortOrder,
                    isRequired: s.isRequired,
                    minSelections: s.minSelections,
                    maxSelections: s.maxSelections,
                    priceOverrides: s.priceOverrides as any
                }))
            })
        ]);

        return this.findOneWithModifiers(targetId);
    }

    // Helper
    public async findOneWithModifiers(id: string) {
        const menuItem = await this.prisma.menuItem.findUnique({
            where: { id },
            include: {
                category: true,
                modifierGroups: {
                    include: {
                        modifierGroup: {
                            include: {
                                modifiers: {
                                    orderBy: { sortOrder: 'asc' },
                                    include: {
                                        nestedGroups: {
                                            include: {
                                                modifiers: {
                                                    orderBy: { sortOrder: 'asc' },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });

        if (!menuItem) {
            throw new NotFoundException(`Menu item with ID "${id}" not found`);
        }

        // Transform to apply overrides
        const modifierGroups = menuItem.modifierGroups.map((mig) => {
            const group = mig.modifierGroup;
            const priceOverrides = mig.priceOverrides as Record<string, number> | null;

            // Apply price overrides to modifiers
            const modifiers = group.modifiers.map((mod) => ({
                ...mod,
                priceAdjustment: priceOverrides?.[mod.id] ?? mod.priceAdjustment,
                originalPrice: mod.priceAdjustment, // Keep original for reference
                hasOverride: priceOverrides?.[mod.id] !== undefined,
            }));

            return {
                id: group.id,
                name: group.name,
                displayName: group.displayName,
                description: group.description,
                selectionType: group.selectionType,
                displayStyle: group.displayStyle,
                showPrices: group.showPrices,
                defaultModifierId: group.defaultModifierId,
                // Apply overrides from assignment
                isRequired: mig.isRequired ?? group.isRequired,
                minSelections: mig.minSelections ?? group.minSelections,
                maxSelections: mig.maxSelections ?? group.maxSelections,
                sortOrder: mig.sortOrder,
                modifiers,
            };
        });

        return {
            ...menuItem,
            modifierGroups,
        };
    }

    private async getRestaurantIdFromItem(itemId: string) {
        const item = await this.prisma.menuItem.findUnique({ where: { id: itemId }, select: { restaurantId: true } });
        if (!item) throw new NotFoundException('Item not found');
        return item.restaurantId;
    }
}
