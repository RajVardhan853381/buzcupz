import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import {
  Prisma,
  ModifierGroup,
  Modifier,
  ModifierSelectionType,
} from "@prisma/client";
import {
  CreateModifierGroupDto,
  UpdateModifierGroupDto,
  ModifierGroupQueryDto,
  CloneModifierGroupDto,
  ReorderModifierGroupsDto,
} from "../dto/modifier-group.dto";

type ModifierGroupWithModifiers = ModifierGroup & {
  modifiers: Modifier[];
  _count?: { menuItems: number };
};

@Injectable()
export class ModifierGroupService {
  private readonly logger = new Logger(ModifierGroupService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // CREATE
  // ============================================
  async create(
    dto: CreateModifierGroupDto,
  ): Promise<ModifierGroupWithModifiers> {
    // Validate selection rules
    this.validateSelectionRules(dto);

    // Check for duplicate name
    const existing = await this.prisma.modifierGroup.findFirst({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Modifier group with name "${dto.name}" already exists`,
      );
    }

    // Create group with modifiers in a transaction
    const group = await this.prisma.$transaction(async (tx) => {
      // Create the group
      const createdGroup = await tx.modifierGroup.create({
        data: {
          name: dto.name,
          displayName: dto.displayName,
          description: dto.description,
          selectionType: dto.selectionType,
          minSelections: dto.minSelections ?? 0,
          maxSelections: dto.maxSelections ?? 1,
          isRequired: dto.isRequired ?? false,
          sortOrder: dto.sortOrder ?? 0,
          displayStyle: dto.displayStyle,
          showPrices: dto.showPrices ?? true,
          conditionalLogic: dto.conditionalLogic as any,
          isActive: dto.isActive ?? true,
          parentModifierId: dto.parentModifierId,
        },
      });

      // Create modifiers if provided
      if (dto.modifiers && dto.modifiers.length > 0) {
        await tx.modifier.createMany({
          data: dto.modifiers.map((mod, index) => ({
            groupId: createdGroup.id,
            name: mod.name,
            displayName: mod.displayName || mod.name,
            description: mod.description,
            priceAdjustment: mod.priceAdjustment ?? 0,
            priceType: (mod.priceType as any) ?? "FIXED",
            percentageValue: mod.percentageValue,
            sortOrder: mod.sortOrder ?? index,
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
            allergens: (mod.allergens as any) ?? [],
          })),
        });

        // Set default modifier if specified
        if (dto.defaultModifierId || dto.modifiers.some((m) => m.isDefault)) {
          const defaultMod = await tx.modifier.findFirst({
            where: {
              groupId: createdGroup.id,
              isDefault: true,
            },
          });

          if (defaultMod) {
            await tx.modifierGroup.update({
              where: { id: createdGroup.id },
              data: { defaultModifierId: defaultMod.id },
            });
          }
        }
      }

      return createdGroup;
    });

    this.logger.log(`Created modifier group: ${group.id} (${group.name})`);

    return this.findOne(group.id);
  }

  // ============================================
  // READ
  // ============================================
  async findAll(
    query: ModifierGroupQueryDto,
  ): Promise<ModifierGroupWithModifiers[]> {
    const where: Prisma.ModifierGroupWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { displayName: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.selectionType) {
      where.selectionType = query.selectionType;
    }

    // Only get top-level groups (not nested)
    where.parentModifierId = null;

    const groups = await this.prisma.modifierGroup.findMany({
      where,
      include: {
        modifiers: query.includeModifiers
          ? {
              where: { isAvailable: true },
              orderBy: { sortOrder: "asc" },
              include: {
                nestedGroups: {
                  include: {
                    modifiers: {
                      where: { isAvailable: true },
                      orderBy: { sortOrder: "asc" },
                    },
                  },
                },
              },
            }
          : false,
        _count: query.includeMenuItemsCount
          ? {
              select: { menuItems: true },
            }
          : false,
      },
      orderBy: { sortOrder: "asc" },
    });

    return groups as ModifierGroupWithModifiers[];
  }

  async findOne(id: string): Promise<ModifierGroupWithModifiers> {
    const group = await this.prisma.modifierGroup.findUnique({
      where: { id },
      include: {
        modifiers: {
          orderBy: { sortOrder: "asc" },
          include: {
            nestedGroups: {
              include: {
                modifiers: {
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
            inventoryItem: {
              select: {
                id: true,
                name: true,
                currentStock: true,
                unit: true,
              },
            },
          },
        },
        _count: {
          select: { menuItems: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(`Modifier group with ID "${id}" not found`);
    }

    return group as ModifierGroupWithModifiers;
  }

  async findByMenuItemId(menuItemId: string): Promise<any[]> {
    const menuItemGroups = await this.prisma.menuItemModifierGroup.findMany({
      where: { menuItemId },
      include: {
        modifierGroup: {
          include: {
            modifiers: {
              where: { isAvailable: true },
              orderBy: { sortOrder: "asc" },
              include: {
                nestedGroups: {
                  where: { isActive: true },
                  include: {
                    modifiers: {
                      where: { isAvailable: true },
                      orderBy: { sortOrder: "asc" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    // Apply overrides
    return menuItemGroups.map((mig) => {
      const group = mig.modifierGroup;
      const priceOverrides = mig.priceOverrides as Record<
        string,
        number
      > | null;

      // Apply modifier price overrides
      const modifiersWithOverrides = group.modifiers.map((mod) => ({
        ...mod,
        priceAdjustment: priceOverrides?.[mod.id] ?? mod.priceAdjustment,
      }));

      return {
        ...group,
        modifiers: modifiersWithOverrides,
        // Apply group overrides
        isRequired: mig.isRequired ?? group.isRequired,
        minSelections: mig.minSelections ?? group.minSelections,
        maxSelections: mig.maxSelections ?? group.maxSelections,
        sortOrder: mig.sortOrder,
      };
    });
  }

  // ============================================
  // UPDATE
  // ============================================
  async update(
    id: string,
    dto: UpdateModifierGroupDto,
  ): Promise<ModifierGroupWithModifiers> {
    // Check exists
    await this.findOne(id);

    // Validate selection rules if changed
    if (
      dto.selectionType ||
      dto.minSelections !== undefined ||
      dto.maxSelections !== undefined
    ) {
      this.validateSelectionRules(dto as CreateModifierGroupDto);
    }

    // Check for duplicate name
    if (dto.name) {
      const existing = await this.prisma.modifierGroup.findFirst({
        where: {
          name: dto.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Modifier group with name "${dto.name}" already exists`,
        );
      }
    }

    await this.prisma.modifierGroup.update({
      where: { id },
      data: {
        name: dto.name,
        displayName: dto.displayName,
        description: dto.description,
        selectionType: dto.selectionType,
        minSelections: dto.minSelections,
        maxSelections: dto.maxSelections,
        isRequired: dto.isRequired,
        sortOrder: dto.sortOrder,
        displayStyle: dto.displayStyle,
        showPrices: dto.showPrices,
        defaultModifierId: dto.defaultModifierId,
        conditionalLogic: dto.conditionalLogic as any,
        isActive: dto.isActive,
      },
    });

    this.logger.log(`Updated modifier group: ${id}`);

    return this.findOne(id);
  }

  // ============================================
  // DELETE
  // ============================================
  async remove(id: string): Promise<void> {
    const group = await this.findOne(id);

    // Check if group is attached to any menu items
    if (group._count && group._count.menuItems > 0) {
      throw new BadRequestException(
        `Cannot delete modifier group that is attached to ${group._count.menuItems} menu item(s). Remove it from all menu items first.`,
      );
    }

    await this.prisma.modifierGroup.delete({
      where: { id },
    });

    this.logger.log(`Deleted modifier group: ${id}`);
  }

  // ============================================
  // CLONE/DUPLICATE
  // ============================================
  async clone(
    id: string,
    dto: CloneModifierGroupDto,
  ): Promise<ModifierGroupWithModifiers> {
    const original = await this.findOne(id);

    const cloned = await this.prisma.$transaction(async (tx) => {
      // Create cloned group
      const newGroup = await tx.modifierGroup.create({
        data: {
          name: dto.newName,
          displayName: dto.newName,
          description: original.description,
          selectionType: original.selectionType,
          minSelections: original.minSelections,
          maxSelections: original.maxSelections,
          isRequired: original.isRequired,
          sortOrder: original.sortOrder,
          displayStyle: original.displayStyle,
          showPrices: original.showPrices,
          conditionalLogic: original.conditionalLogic as any,
          isActive: original.isActive,
        },
      });

      // Clone modifiers if requested
      if (dto.includeModifiers && original.modifiers.length > 0) {
        await tx.modifier.createMany({
          data: original.modifiers.map((mod) => ({
            groupId: newGroup.id,
            name: mod.name,
            displayName: mod.displayName,
            description: mod.description,
            priceAdjustment: mod.priceAdjustment,
            priceType: mod.priceType,
            percentageValue: mod.percentageValue,
            sortOrder: mod.sortOrder,
            imageUrl: mod.imageUrl,
            color: mod.color,
            isDefault: mod.isDefault,
            isAvailable: mod.isAvailable,
            isPremium: mod.isPremium,
            isPopular: mod.isPopular,
            minQuantity: mod.minQuantity,
            maxQuantity: mod.maxQuantity,
            defaultQuantity: mod.defaultQuantity,
            quantityStep: mod.quantityStep,
            pricePerQuantity: mod.pricePerQuantity,
            freeQuantity: mod.freeQuantity,
            calories: mod.calories,
            allergens: mod.allergens,
          })),
        });
      }

      return newGroup;
    });

    this.logger.log(`Cloned modifier group ${id} to ${cloned.id}`);

    return this.findOne(cloned.id);
  }

  // ============================================
  // REORDER
  // ============================================
  async reorder(dto: ReorderModifierGroupsDto): Promise<void> {
    await this.prisma.$transaction(
      dto.groupIds.map((id, index) =>
        this.prisma.modifierGroup.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    this.logger.log(`Reordered ${dto.groupIds.length} modifier groups`);
  }

  // ============================================
  // BULK TOGGLE
  // ============================================
  async bulkToggleActive(ids: string[], isActive: boolean): Promise<number> {
    const result = await this.prisma.modifierGroup.updateMany({
      where: { id: { in: ids } },
      data: { isActive },
    });

    this.logger.log(
      `${isActive ? "Activated" : "Deactivated"} ${result.count} modifier groups`,
    );

    return result.count;
  }

  // ============================================
  // VALIDATION HELPERS
  // ============================================
  private validateSelectionRules(dto: Partial<CreateModifierGroupDto>): void {
    const { selectionType, minSelections = 0, maxSelections = 1 } = dto;

    if (minSelections > maxSelections) {
      throw new BadRequestException(
        "minSelections cannot be greater than maxSelections",
      );
    }

    if (selectionType === ModifierSelectionType.SINGLE && maxSelections > 1) {
      throw new BadRequestException(
        "SINGLE selection type can only have maxSelections of 1",
      );
    }

    if (minSelections < 0) {
      throw new BadRequestException("minSelections cannot be negative");
    }
  }

  // ============================================
  // STATS
  // ============================================
  async getStats(): Promise<{
    total: number;
    active: number;
    withModifiers: number;
    attachedToItems: number;
  }> {
    const [total, active, withModifiers, attachedToItems] = await Promise.all([
      this.prisma.modifierGroup.count(),
      this.prisma.modifierGroup.count({ where: { isActive: true } }),
      this.prisma.modifierGroup.count({
        where: { modifiers: { some: {} } },
      }),
      this.prisma.modifierGroup.count({
        where: { menuItems: { some: {} } },
      }),
    ]);

    return { total, active, withModifiers, attachedToItems };
  }
}
