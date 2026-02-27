import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../database/prisma.service";
import { InventoryGateway } from "./inventory.gateway";
import { CreateInventoryItemDto } from "./dto/create-inventory-item.dto";
import { UpdateInventoryItemDto } from "./dto/update-inventory-item.dto";
import {
  StockAdjustmentDto,
  AdjustmentType,
  AdjustmentReason,
} from "./dto/stock-adjustment.dto";
import { BulkAdjustmentDto } from "./dto/bulk-adjustment.dto";
import {
  InventoryFiltersDto,
  StockStatus,
  SortField,
} from "./dto/inventory-filters.dto";
import { MovementFiltersDto } from "./dto/movement-filters.dto";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { Prisma } from "@prisma/client";
import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  addDays,
  subDays,
} from "date-fns";

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  categoriesCount: number;
  suppliersCount: number;
  recentMovements: number;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: InventoryGateway,
    @InjectQueue("inventory") private readonly queue: Queue,
  ) {}

  // ============================================
  // INVENTORY ITEMS CRUD
  // ============================================

  async createItem(
    dto: CreateInventoryItemDto,
    restaurantId: string,
    userId: string,
  ) {
    // Check for duplicate SKU if provided
    if (dto.sku) {
      const existing = await this.prisma.inventoryItem.findFirst({
        where: { sku: dto.sku, restaurantId },
      });

      if (existing) {
        throw new ConflictException(
          `Item with SKU "${dto.sku}" already exists`,
        );
      }
    }

    // Validate supplier if provided
    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findFirst({
        where: { id: dto.supplierId, restaurantId },
      });
      if (!supplier) {
        throw new BadRequestException("Supplier not found");
      }
    }

    // Create item with transaction for initial stock movement
    const item = await this.prisma.$transaction(async (tx) => {
      const newItem = await tx.inventoryItem.create({
        data: {
          name: dto.name,
          sku: dto.sku,
          description: dto.description,
          category: dto.category,
          unit: dto.unit,
          costPerUnit: dto.costPerUnit,
          currentStock: dto.currentStock || 0,
          minimumStock: dto.minimumStock,
          reorderPoint: dto.reorderPoint || dto.minimumStock * 1.5,
          reorderQuantity: dto.reorderQuantity || dto.minimumStock * 2,
          storageLocation: dto.storageLocation,
          supplierId: dto.supplierId,
          isPerishable: dto.isPerishable || false,
          shelfLifeDays: dto.shelfLifeDays,
          expiryDate: dto.expiryDate ? parseISO(dto.expiryDate) : undefined,
          restaurantId,
        },
        include: {
          supplier: true,
        },
      });

      // Create initial stock movement if there's opening stock
      if (dto.currentStock && dto.currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            type: "ADJUSTMENT",
            quantity: dto.currentStock,
            previousStock: 0,
            newStock: dto.currentStock,
            unitCost: dto.costPerUnit,
            totalCost: dto.currentStock * dto.costPerUnit,
            reference: "Opening stock",
            inventoryItemId: newItem.id,
            restaurantId,
            createdById: userId,
          },
        });
      }

      return newItem;
    });

    // Check stock levels and create alerts if needed
    await this.checkAndCreateAlerts(item.id, restaurantId);

    this.gateway.broadcastInventoryUpdate(restaurantId, {
      action: "ITEM_CREATED",
      item,
    });

    this.logger.log(`Created inventory item: ${item.sku || item.name}`);

    return item;
  }

  async findAllItems(restaurantId: string, filters: InventoryFiltersDto) {
    const where: Prisma.InventoryItemWhereInput = { restaurantId };

    // Search filter
    if (filters.search) {
      const search = filters.search.trim();
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (filters.category) {
      where.category = filters.category;
    }

    // Stock status filter
    if (filters.stockStatus && filters.stockStatus !== StockStatus.ALL) {
      switch (filters.stockStatus) {
        case StockStatus.OUT_OF_STOCK:
          where.currentStock = { equals: 0 };
          break;
        case StockStatus.LOW_STOCK:
          where.isLowStock = true;
          break;
        case StockStatus.IN_STOCK:
          where.AND = [{ currentStock: { gt: 0 } }, { isLowStock: false }];
          break;
      }
    }

    // Supplier filter
    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
    }

    // Perishable filter
    if (filters.isPerishable !== undefined) {
      where.isPerishable = filters.isPerishable;
    }

    // Active filter
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Location filter
    if (filters.storageLocation) {
      where.storageLocation = {
        contains: filters.storageLocation,
        mode: "insensitive",
      };
    }

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 25, 100);
    const skip = (page - 1) * limit;

    // Build orderBy
    let orderBy: Prisma.InventoryItemOrderByWithRelationInput = { name: "asc" };
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case SortField.CURRENT_STOCK:
          orderBy = { currentStock: filters.sortOrder || "asc" };
          break;
        case SortField.COST_PER_UNIT:
          orderBy = { costPerUnit: filters.sortOrder || "asc" };
          break;
        case SortField.SKU:
          orderBy = { sku: filters.sortOrder || "asc" };
          break;
        case SortField.UPDATED:
          orderBy = { updatedAt: filters.sortOrder || "desc" };
          break;
        case SortField.CATEGORY:
          orderBy = { category: filters.sortOrder || "asc" };
          break;
        default:
          orderBy = { name: filters.sortOrder || "asc" };
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
          _count: {
            select: {
              stockMovements: true,
              alerts: { where: { status: "ACTIVE" } },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    // Calculate totals
    const aggregations = await this.prisma.inventoryItem.aggregate({
      where: { restaurantId, isActive: true },
      _sum: { currentStock: true },
      _count: { id: true },
    });

    // Calculate total value
    const valueResult = await this.prisma.$queryRaw<[{ total: number }]>`
      SELECT COALESCE(SUM("currentStock" * "costPerUnit"), 0) as total
      FROM "InventoryItem"
      WHERE "restaurantId" = ${restaurantId} AND "isActive" = true
    `;

    return {
      data: items.map((item) => ({
        ...item,
        totalValue: Number(item.currentStock) * Number(item.costPerUnit),
        stockStatus: this.getStockStatus(item),
        hasAlerts: item._count.alerts > 0,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + items.length < total,
      },
      summary: {
        totalItems: aggregations._count.id,
        totalValue: Number(valueResult[0]?.total || 0),
      },
    };
  }

  async findItemById(id: string, restaurantId: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, restaurantId },
      include: {
        supplier: true,
        stockMovements: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { createdBy: { select: { name: true } } },
        },
        alerts: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!item) {
      throw new NotFoundException("Inventory item not found");
    }

    return {
      ...item,
      totalValue: Number(item.currentStock) * Number(item.costPerUnit),
      stockStatus: this.getStockStatus(item),
    };
  }

  async updateItem(
    id: string,
    dto: UpdateInventoryItemDto,
    restaurantId: string,
  ) {
    const existing = await this.prisma.inventoryItem.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      throw new NotFoundException("Inventory item not found");
    }

    const updated = await this.prisma.inventoryItem.update({
      where: { id },
      data: {
        ...dto,
        expiryDate: dto.expiryDate ? parseISO(dto.expiryDate) : undefined,
      },
      include: {
        supplier: true,
      },
    });

    // Re-check alerts if stock levels changed
    if (dto.minimumStock !== undefined || dto.reorderPoint !== undefined) {
      await this.checkAndCreateAlerts(id, restaurantId);
    }

    this.gateway.broadcastInventoryUpdate(restaurantId, {
      action: "ITEM_UPDATED",
      item: updated,
    });

    return updated;
  }

  async deleteItem(id: string, restaurantId: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, restaurantId },
    });

    if (!item) {
      throw new NotFoundException("Inventory item not found");
    }

    // Soft delete - mark as inactive
    await this.prisma.inventoryItem.update({
      where: { id },
      data: { isActive: false },
    });

    this.gateway.broadcastInventoryUpdate(restaurantId, {
      action: "ITEM_DELETED",
      itemId: id,
    });

    return { message: "Item deactivated successfully" };
  }

  // ============================================
  // STOCK ADJUSTMENTS
  // ============================================

  async adjustStock(
    itemId: string,
    dto: StockAdjustmentDto,
    restaurantId: string,
    userId: string,
  ) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, restaurantId },
    });

    if (!item) {
      throw new NotFoundException("Inventory item not found");
    }

    const previousStock = Number(item.currentStock);
    let newStock: number;

    switch (dto.type) {
      case AdjustmentType.ADD:
        newStock = previousStock + dto.quantity;
        break;
      case AdjustmentType.REMOVE:
        if (dto.quantity > previousStock) {
          throw new BadRequestException(
            `Cannot remove ${dto.quantity} ${item.unit}. Only ${previousStock} in stock.`,
          );
        }
        newStock = previousStock - dto.quantity;
        break;
      case AdjustmentType.SET:
        if (dto.quantity < 0) {
          throw new BadRequestException("Stock cannot be negative");
        }
        newStock = dto.quantity;
        break;
    }

    // Determine movement type based on reason
    let movementType: string;
    switch (dto.reason) {
      case AdjustmentReason.PURCHASE:
        movementType = "PURCHASE";
        break;
      case AdjustmentReason.SALE:
        movementType = "USAGE";
        break;
      case AdjustmentReason.DAMAGE:
      case AdjustmentReason.EXPIRY:
      case AdjustmentReason.THEFT:
        movementType = "WASTAGE";
        break;
      case AdjustmentReason.TRANSFER_IN:
      case AdjustmentReason.TRANSFER_OUT:
        movementType = "TRANSFER";
        break;
      default:
        movementType = "ADJUSTMENT";
    }

    const unitCost = dto.unitCost ?? Number(item.costPerUnit);
    const quantityChange = Math.abs(newStock - previousStock);
    const totalCost = quantityChange * unitCost;

    // Transaction for atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Create movement record
      const movement = await tx.stockMovement.create({
        data: {
          type: movementType as any,
          quantity:
            dto.type === AdjustmentType.REMOVE ? -dto.quantity : dto.quantity,
          previousStock,
          newStock,
          unitCost,
          totalCost,
          reference: dto.reference,
          notes: dto.notes,
          inventoryItemId: itemId,
          restaurantId,
          createdById: userId,
        },
        include: {
          createdBy: { select: { name: true } },
        },
      });

      // Update item stock
      const updatedItem = await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          currentStock: newStock,
          costPerUnit: dto.unitCost ?? undefined,
          isLowStock: newStock <= Number(item.minimumStock),
        },
        include: {
          supplier: true,
        },
      });

      return { movement, item: updatedItem };
    });

    // Check and create alerts
    await this.checkAndCreateAlerts(itemId, restaurantId);

    // Broadcast update
    this.gateway.broadcastInventoryUpdate(restaurantId, {
      action: "STOCK_ADJUSTED",
      item: result.item,
      movement: result.movement,
    });

    this.logger.log(
      `Stock adjusted: ${item.name} - ${dto.type} ${dto.quantity} ${item.unit} (${previousStock} → ${newStock})`,
    );

    return result;
  }

  async bulkAdjust(
    dto: BulkAdjustmentDto,
    restaurantId: string,
    userId: string,
  ) {
    const results = [];

    for (const adjustment of dto.adjustments) {
      try {
        const result = await this.adjustStock(
          adjustment.itemId,
          adjustment,
          restaurantId,
          userId,
        );
        results.push({ itemId: adjustment.itemId, success: true, result });
      } catch (error) {
        results.push({
          itemId: adjustment.itemId,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      total: dto.adjustments.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  // ============================================
  // STOCK MOVEMENTS HISTORY
  // ============================================

  async getMovements(restaurantId: string, filters: MovementFiltersDto) {
    const where: Prisma.StockMovementWhereInput = { restaurantId };

    if (filters.itemId) {
      where.inventoryItemId = filters.itemId;
    }

    if (filters.type) {
      where.type = filters.type as any;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = startOfDay(parseISO(filters.dateFrom));
      }
      if (filters.dateTo) {
        where.createdAt.lte = endOfDay(parseISO(filters.dateTo));
      }
    }

    if (filters.createdById) {
      where.createdById = filters.createdById;
    }

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 100);
    const skip = (page - 1) * limit;

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          inventoryItem: {
            select: { id: true, name: true, sku: true, unit: true },
          },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      data: movements.map((m) => ({
        ...m,
        formattedDate: format(m.createdAt, "MMM d, yyyy h:mm a"),
        isAddition: Number(m.quantity) > 0,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // SUPPLIERS
  // ============================================

  async createSupplier(dto: CreateSupplierDto, restaurantId: string) {
    const existing = await this.prisma.supplier.findFirst({
      where: { name: dto.name, restaurantId },
    });

    if (existing) {
      throw new ConflictException(`Supplier "${dto.name}" already exists`);
    }

    return this.prisma.supplier.create({
      data: { ...dto, restaurantId },
    });
  }

  async getSuppliers(restaurantId: string) {
    return this.prisma.supplier.findMany({
      where: { restaurantId, isActive: true },
      include: {
        _count: { select: { inventoryItems: { where: { isActive: true } } } },
      },
      orderBy: { name: "asc" },
    });
  }

  async updateSupplier(
    id: string,
    dto: Partial<CreateSupplierDto>,
    restaurantId: string,
  ) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, restaurantId },
    });

    if (!supplier) {
      throw new NotFoundException("Supplier not found");
    }

    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  // ============================================
  // ALERTS
  // ============================================

  async getAlerts(restaurantId: string, includeResolved = false) {
    const where: Prisma.InventoryAlertWhereInput = { restaurantId };

    if (!includeResolved) {
      where.status = "ACTIVE";
    }

    return this.prisma.inventoryAlert.findMany({
      where,
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            sku: true,
            currentStock: true,
            unit: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async resolveAlert(alertId: string, restaurantId: string) {
    const alert = await this.prisma.inventoryAlert.findFirst({
      where: { id: alertId, restaurantId },
    });

    if (!alert) {
      throw new NotFoundException("Alert not found");
    }

    return this.prisma.inventoryAlert.update({
      where: { id: alertId },
      data: { status: "RESOLVED" },
    });
  }

  // ============================================
  // ANALYTICS & REPORTS
  // ============================================

  async getStats(restaurantId: string): Promise<InventoryStats> {
    const [
      totalItems,
      lowStockItems,
      outOfStockItems,
      categoriesCount,
      suppliersCount,
      recentMovements,
    ] = await Promise.all([
      this.prisma.inventoryItem.count({
        where: { restaurantId, isActive: true },
      }),
      this.prisma.inventoryItem.count({
        where: { restaurantId, isActive: true, isLowStock: true },
      }),
      this.prisma.inventoryItem.count({
        where: { restaurantId, isActive: true, currentStock: { equals: 0 } },
      }),
      this.prisma.inventoryItem
        .findMany({
          where: { restaurantId, isActive: true },
          select: { category: true },
          distinct: ["category"],
        })
        .then((cats) => cats.filter((c) => c.category).length),
      this.prisma.supplier.count({ where: { restaurantId, isActive: true } }),
      this.prisma.stockMovement.count({
        where: { restaurantId, createdAt: { gte: subDays(new Date(), 7) } },
      }),
    ]);

    // Calculate total value
    const valueResult = await this.prisma.$queryRaw<[{ total: number }]>`
      SELECT COALESCE(SUM("currentStock" * "costPerUnit"), 0) as total
      FROM "InventoryItem"
      WHERE "restaurantId" = ${restaurantId} AND "isActive" = true
    `;

    return {
      totalItems,
      totalValue: Number(valueResult[0]?.total || 0),
      lowStockItems,
      outOfStockItems,
      categoriesCount,
      suppliersCount,
      recentMovements,
    };
  }

  async getLowStockItems(restaurantId: string, limit = 20) {
    return this.prisma.inventoryItem.findMany({
      where: {
        restaurantId,
        isActive: true,
        isLowStock: true,
      },
      include: {
        supplier: { select: { name: true } },
      },
      orderBy: { currentStock: "asc" },
      take: limit,
    });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private getStockStatus(item: any): string {
    const current = Number(item.currentStock);
    const min = Number(item.minimumStock);

    if (current === 0) return "OUT_OF_STOCK";
    if (current <= min * 0.5) return "CRITICAL";
    if (current <= min) return "LOW_STOCK";
    return "IN_STOCK";
  }

  private async checkAndCreateAlerts(itemId: string, restaurantId: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item) return;

    const currentStock = Number(item.currentStock);
    const minStock = Number(item.minimumStock);

    // Clear existing active alerts for this item
    await this.prisma.inventoryAlert.updateMany({
      where: { inventoryItemId: itemId, status: "ACTIVE" },
      data: { status: "RESOLVED" },
    });

    let message = "";
    let shouldAlert = false;

    if (currentStock === 0) {
      message = `${item.name} is out of stock!`;
      shouldAlert = true;
    } else if (currentStock <= minStock * 0.5) {
      message = `${item.name} stock critically low: ${currentStock} ${item.unit} remaining`;
      shouldAlert = true;
    } else if (currentStock <= minStock) {
      message = `${item.name} stock low: ${currentStock} ${item.unit} (min: ${minStock})`;
      shouldAlert = true;
    }

    if (shouldAlert) {
      const alert = await this.prisma.inventoryAlert.create({
        data: {
          message,
          status: "ACTIVE",
          inventoryItemId: itemId,
          restaurantId,
        },
        include: {
          inventoryItem: { select: { name: true, sku: true } },
        },
      });

      // Broadcast alert
      this.gateway.broadcastAlert(restaurantId, alert);
    }
  }

  // ============================================
  // CRON JOBS
  // ============================================

  @Cron(CronExpression.EVERY_HOUR)
  async checkLowStockLevels() {
    this.logger.log("Running hourly low stock check...");

    const restaurants = await this.prisma.restaurant.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const restaurant of restaurants) {
      const lowStockItems = await this.prisma.inventoryItem.findMany({
        where: {
          restaurantId: restaurant.id,
          isActive: true,
          isLowStock: true,
        },
        select: { id: true },
      });

      for (const item of lowStockItems) {
        await this.checkAndCreateAlerts(item.id, restaurant.id);
      }
    }
  }
}
