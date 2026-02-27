import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Modifier, Prisma } from '@prisma/client';
import {
    CreateModifierDto,
    UpdateModifierDto,
    BulkCreateModifiersDto,
    ReorderModifiersDto,
} from '../dto/modifier-group.dto';

@Injectable()
export class ModifierService {
    private readonly logger = new Logger(ModifierService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ============================================
    // CREATE
    // ============================================
    async create(groupId: string, dto: CreateModifierDto): Promise<Modifier> {
        // Verify group exists
        const group = await this.prisma.modifierGroup.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            throw new NotFoundException(`Modifier group with ID "${groupId}" not found`);
        }

        // Get next sort order
        const lastModifier = await this.prisma.modifier.findFirst({
            where: { groupId },
            orderBy: { sortOrder: 'desc' },
        });

        const sortOrder = dto.sortOrder ?? (lastModifier ? lastModifier.sortOrder + 1 : 0);

        const modifier = await this.prisma.modifier.create({
            data: {
                groupId,
                name: dto.name,
                displayName: dto.displayName || dto.name,
                description: dto.description,
                priceAdjustment: dto.priceAdjustment ?? 0,
                priceType: dto.priceType as any ?? 'FIXED',
                percentageValue: dto.percentageValue,
                sortOrder,
                imageUrl: dto.imageUrl,
                color: dto.color,
                isDefault: dto.isDefault ?? false,
                isAvailable: dto.isAvailable ?? true,
                isPremium: dto.isPremium ?? false,
                isPopular: dto.isPopular ?? false,
                minQuantity: dto.minQuantity ?? 0,
                maxQuantity: dto.maxQuantity ?? 10,
                defaultQuantity: dto.defaultQuantity ?? 0,
                quantityStep: dto.quantityStep ?? 1,
                pricePerQuantity: dto.pricePerQuantity,
                freeQuantity: dto.freeQuantity ?? 0,
                inventoryItemId: dto.inventoryItemId,
                deductQuantity: dto.deductQuantity,
                calories: dto.calories,
                allergens: dto.allergens as any ?? [],
            },
        });

        // If this is set as default, unset other defaults in the group
        if (dto.isDefault) {
            await this.setAsDefault(modifier.id, groupId);
        }

        this.logger.log(`Created modifier: ${modifier.id} (${modifier.name})`);

        return modifier;
    }

    async bulkCreate(dto: BulkCreateModifiersDto): Promise<Modifier[]> {
        // Verify group exists
        const group = await this.prisma.modifierGroup.findUnique({
            where: { id: dto.groupId },
        });

        if (!group) {
            throw new NotFoundException(`Modifier group with ID "${dto.groupId}" not found`);
        }

        // Get starting sort order
        const lastModifier = await this.prisma.modifier.findFirst({
            where: { groupId: dto.groupId },
            orderBy: { sortOrder: 'desc' },
        });

        let sortOrder = lastModifier ? lastModifier.sortOrder + 1 : 0;

        const modifiers = await this.prisma.$transaction(
            dto.modifiers.map((mod) => {
                const currentSortOrder = sortOrder++;
                return this.prisma.modifier.create({
                    data: {
                        groupId: dto.groupId,
                        name: mod.name,
                        displayName: mod.displayName || mod.name,
                        description: mod.description,
                        priceAdjustment: mod.priceAdjustment ?? 0,
                        priceType: mod.priceType as any ?? 'FIXED',
                        percentageValue: mod.percentageValue,
                        sortOrder: mod.sortOrder ?? currentSortOrder,
                        imageUrl: mod.imageUrl,
                        color: mod.color,
                        isDefault: mod.isDefault ?? false,
                        isAvailable: mod.isAvailable ?? true,
                        isPremium: mod.isPremium ?? false,
                        isPopular: mod.isPopular ?? false,
                        minQuantity: mod.minQuantity ?? 0,
                        maxQuantity: mod.maxQuantity ?? 10,
                        defaultQuantity: mod.defaultQuantity ?? 0,
                        quantityStep: mod.quantityStep ?? 1,
                        pricePerQuantity: mod.pricePerQuantity,
                        freeQuantity: mod.freeQuantity ?? 0,
                        inventoryItemId: mod.inventoryItemId,
                        deductQuantity: mod.deductQuantity,
                        calories: mod.calories,
                        allergens: mod.allergens as any ?? [],
                    },
                });
            })
        );

        this.logger.log(`Bulk created ${modifiers.length} modifiers for group ${dto.groupId}`);

        return modifiers;
    }

    // ============================================
    // READ
    // ============================================
    async findOne(id: string): Promise<Modifier> {
        const modifier = await this.prisma.modifier.findUnique({
            where: { id },
            include: {
                group: true,
                nestedGroups: {
                    include: {
                        modifiers: {
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                },
                inventoryItem: true,
            },
        });

        if (!modifier) {
            throw new NotFoundException(`Modifier with ID "${id}" not found`);
        }

        return modifier;
    }

    async findByGroupId(groupId: string): Promise<Modifier[]> {
        return this.prisma.modifier.findMany({
            where: { groupId },
            include: {
                nestedGroups: {
                    include: {
                        modifiers: {
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });
    }

    // ============================================
    // UPDATE
    // ============================================
    async update(id: string, dto: UpdateModifierDto): Promise<Modifier> {
        const existing = await this.findOne(id);

        const updated = await this.prisma.modifier.update({
            where: { id },
            data: {
                name: dto.name,
                displayName: dto.displayName,
                description: dto.description,
                priceAdjustment: dto.priceAdjustment,
                priceType: dto.priceType as any,
                percentageValue: dto.percentageValue,
                sortOrder: dto.sortOrder,
                imageUrl: dto.imageUrl,
                color: dto.color,
                isDefault: dto.isDefault,
                isAvailable: dto.isAvailable,
                isPremium: dto.isPremium,
                isPopular: dto.isPopular,
                minQuantity: dto.minQuantity,
                maxQuantity: dto.maxQuantity,
                defaultQuantity: dto.defaultQuantity,
                quantityStep: dto.quantityStep,
                pricePerQuantity: dto.pricePerQuantity,
                freeQuantity: dto.freeQuantity,
                inventoryItemId: dto.inventoryItemId,
                deductQuantity: dto.deductQuantity,
                calories: dto.calories,
                allergens: dto.allergens as any,
            },
        });

        // Handle default change
        if (dto.isDefault === true && !existing.isDefault) {
            await this.setAsDefault(id, existing.groupId);
        }

        this.logger.log(`Updated modifier: ${id}`);

        return updated;
    }

    // ============================================
    // DELETE
    // ============================================
    async remove(id: string): Promise<void> {
        const modifier = await this.findOne(id);

        // Check if modifier is used in any orders
        const orderUsage = await this.prisma.orderItemModifier.count({
            where: { modifierId: id },
        });

        if (orderUsage > 0) {
            // Soft delete by marking unavailable
            await this.prisma.modifier.update({
                where: { id },
                data: { isAvailable: false },
            });
            this.logger.log(`Soft deleted modifier ${id} (used in ${orderUsage} orders)`);
        } else {
            // Hard delete
            await this.prisma.modifier.delete({
                where: { id },
            });
            this.logger.log(`Deleted modifier: ${id}`);
        }
    }

    async bulkRemove(ids: string[]): Promise<number> {
        // Soft delete modifiers that are used in orders
        const usedModifiers = await this.prisma.orderItemModifier.findMany({
            where: { modifierId: { in: ids } },
            select: { modifierId: true },
            distinct: ['modifierId'],
        });

        const usedIds = usedModifiers.map((m) => m.modifierId);
        const unusedIds = ids.filter((id) => !usedIds.includes(id));

        // Soft delete used ones
        if (usedIds.length > 0) {
            await this.prisma.modifier.updateMany({
                where: { id: { in: usedIds } },
                data: { isAvailable: false },
            });
        }

        // Hard delete unused ones
        if (unusedIds.length > 0) {
            await this.prisma.modifier.deleteMany({
                where: { id: { in: unusedIds } },
            });
        }

        const total = usedIds.length + unusedIds.length;
        this.logger.log(`Bulk removed ${total} modifiers (${usedIds.length} soft, ${unusedIds.length} hard)`);

        return total;
    }

    // ============================================
    // REORDER
    // ============================================
    async reorder(groupId: string, dto: ReorderModifiersDto): Promise<void> {
        await this.prisma.$transaction(
            dto.modifierIds.map((id, index) =>
                this.prisma.modifier.update({
                    where: { id },
                    data: { sortOrder: index },
                })
            )
        );

        this.logger.log(`Reordered ${dto.modifierIds.length} modifiers in group ${groupId}`);
    }

    // ============================================
    // TOGGLE AVAILABILITY
    // ============================================
    async toggleAvailability(id: string): Promise<Modifier> {
        const modifier = await this.findOne(id);

        return this.prisma.modifier.update({
            where: { id },
            data: { isAvailable: !modifier.isAvailable },
        });
    }

    async bulkToggleAvailability(ids: string[], isAvailable: boolean): Promise<number> {
        const result = await this.prisma.modifier.updateMany({
            where: { id: { in: ids } },
            data: { isAvailable },
        });

        return result.count;
    }

    // ============================================
    // SET DEFAULT
    // ============================================
    async setAsDefault(id: string, groupId: string): Promise<void> {
        await this.prisma.$transaction([
            // Unset all other defaults in the group
            this.prisma.modifier.updateMany({
                where: {
                    groupId,
                    id: { not: id },
                },
                data: { isDefault: false },
            }),
            // Set this one as default
            this.prisma.modifier.update({
                where: { id },
                data: { isDefault: true },
            }),
            // Update group's defaultModifierId
            this.prisma.modifierGroup.update({
                where: { id: groupId },
                data: { defaultModifierId: id },
            }),
        ]);
    }

    // ============================================
    // NESTED GROUPS
    // ============================================
    async addNestedGroup(modifierId: string, groupId: string): Promise<void> {
        await this.prisma.modifierGroup.update({
            where: { id: groupId },
            data: { parentModifierId: modifierId },
        });
    }

    async removeNestedGroup(groupId: string): Promise<void> {
        await this.prisma.modifierGroup.update({
            where: { id: groupId },
            data: { parentModifierId: null },
        });
    }

    // ============================================
    // PRICE CALCULATION
    // ============================================
    calculateModifierPrice(
        modifier: Modifier,
        basePrice: number,
        quantity: number = 1
    ): number {
        const priceType = modifier.priceType;
        const priceAdjustment = Number(modifier.priceAdjustment) || 0;

        switch (priceType) {
            case 'FIXED':
                return priceAdjustment * quantity;

            case 'PERCENTAGE':
                const percentage = Number(modifier.percentageValue) || 0;
                return (basePrice * percentage / 100) * quantity;

            case 'REPLACEMENT':
                return (priceAdjustment - basePrice) * quantity;

            case 'FREE':
                return 0;

            case 'QUANTITY_BASED':
                const freeQty = modifier.freeQuantity || 0;
                const pricePerQty = Number(modifier.pricePerQuantity) || 0;
                const billableQty = Math.max(0, quantity - freeQty);
                return billableQty * pricePerQty;

            default:
                return priceAdjustment * quantity;
        }
    }
}
