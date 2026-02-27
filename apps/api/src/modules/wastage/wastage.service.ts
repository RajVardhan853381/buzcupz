import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../database/prisma.service";
import { CreateWastageDto, WastageReason } from "./dto/create-wastage.dto";
import { WastageFiltersDto } from "./dto/wastage-filters.dto";
import { Prisma } from "@prisma/client";
import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  subDays,
  subWeeks,
  subMonths,
} from "date-fns";

export interface WastageStats {
  today: {
    incidents: number;
    totalCost: number;
    topReason: string | null;
  };
  thisWeek: {
    incidents: number;
    totalCost: number;
    avgDailyCost: number;
  };
  thisMonth: {
    incidents: number;
    totalCost: number;
  };
  trends: {
    vsLastWeek: number;
    vsLastMonth: number;
  };
}

@Injectable()
export class WastageService {
  private readonly logger = new Logger(WastageService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // CREATE WASTAGE LOG
  // ============================================

  async create(dto: CreateWastageDto, restaurantId: string, userId: string) {
    // Get item details
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: dto.inventoryItemId, restaurantId },
    });

    if (!item) {
      throw new BadRequestException("Inventory item not found");
    }

    const unitCost = Number(item.unitCost);
    const totalCost = dto.quantity * unitCost;
    const wastedAt = dto.occurredAt ? parseISO(dto.occurredAt) : new Date();

    // Create wastage record and deduct from inventory
    const wastageRecord = await this.prisma.$transaction(async (tx) => {
      // Create the record
      const record = await tx.wastageRecord.create({
        data: {
          inventoryItemId: dto.inventoryItemId,
          quantity: dto.quantity,
          unit: item.unit,
          unitCost,
          totalCost,
          reason: dto.reason as any,
          reasonDetails: dto.description,
          wastedAt,
          recordedById: userId,
          restaurantId,
        },
        include: {
          inventoryItem: { select: { id: true, name: true, sku: true } },
          recordedBy: { select: { id: true, name: true } },
        },
      });

      // Deduct from inventory
      const previousStock = Number(item.currentStock);
      const newStock = Math.max(0, previousStock - dto.quantity);

      await tx.inventoryItem.update({
        where: { id: dto.inventoryItemId },
        data: { currentStock: newStock },
      });

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          type: "WASTAGE",
          quantity: -dto.quantity,
          previousStock,
          newStock,
          unitCost,
          totalCost,
          notes: dto.description,
          createdById: userId,
          inventoryItemId: dto.inventoryItemId,
        },
      });

      return record;
    });

    this.logger.log(
      `Wastage logged: ${item.name} - ${dto.quantity} ${item.unit} - $${totalCost.toFixed(2)} - ${dto.reason}`,
    );

    return wastageRecord;
  }

  // ============================================
  // GET WASTAGE LOGS
  // ============================================

  async findAll(restaurantId: string, filters: WastageFiltersDto) {
    const where: Prisma.WastageRecordWhereInput = { restaurantId };

    if (filters.reason) {
      where.reason = filters.reason as any;
    }

    if (filters.station) {
      // station removed from schema, ignoring
    }

    if (filters.dateFrom || filters.dateTo) {
      where.wastedAt = {};
      if (filters.dateFrom) {
        where.wastedAt.gte = startOfDay(parseISO(filters.dateFrom));
      }
      if (filters.dateTo) {
        where.wastedAt.lte = endOfDay(parseISO(filters.dateTo));
      }
    }

    if (filters.search) {
      where.OR = [
        { notes: { contains: filters.search, mode: "insensitive" } },
        {
          inventoryItem: {
            name: { contains: filters.search, mode: "insensitive" },
          },
        },
      ];
    }

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 25, 100);
    const skip = (page - 1) * limit;

    const [logs, total, aggregations] = await Promise.all([
      this.prisma.wastageRecord.findMany({
        where,
        include: {
          inventoryItem: { select: { id: true, name: true, sku: true } },
          recordedBy: { select: { id: true, name: true } },
        },
        orderBy: { wastedAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.wastageRecord.count({ where }),
      this.prisma.wastageRecord.aggregate({
        where,
        _sum: { totalCost: true, quantity: true },
        _count: { id: true },
      }),
    ]);

    return {
      data: logs.map((log) => ({
        ...log,
        itemName: log.inventoryItem?.name || "Unknown",
        formattedDate: format(log.wastedAt, "MMM d, yyyy h:mm a"),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalIncidents: aggregations._count.id,
        totalCost: Number(aggregations._sum.totalCost || 0),
        totalQuantity: Number(aggregations._sum.quantity || 0),
      },
    };
  }

  async findById(id: string, restaurantId: string) {
    const log = await this.prisma.wastageRecord.findFirst({
      where: { id, restaurantId },
      include: {
        inventoryItem: true,
        recordedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!log) {
      throw new NotFoundException("Wastage log not found");
    }

    return {
      ...log,
      itemName: log.inventoryItem?.name || "Unknown",
      formattedDate: format(log.wastedAt, "EEEE, MMMM d, yyyy h:mm a"),
    };
  }

  // ============================================
  // STATISTICS
  // ============================================

  async getStats(restaurantId: string): Promise<WastageStats> {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);
    const lastWeekStart = subWeeks(weekStart, 1);
    const lastMonthStart = subMonths(monthStart, 1);

    const [
      todayData,
      weekData,
      monthData,
      lastWeekData,
      lastMonthData,
      topReasonToday,
    ] = await Promise.all([
      this.prisma.wastageRecord.aggregate({
        where: { restaurantId, wastedAt: { gte: todayStart } },
        _sum: { totalCost: true },
        _count: { id: true },
      }),
      this.prisma.wastageRecord.aggregate({
        where: { restaurantId, wastedAt: { gte: weekStart } },
        _sum: { totalCost: true },
        _count: { id: true },
      }),
      this.prisma.wastageRecord.aggregate({
        where: { restaurantId, wastedAt: { gte: monthStart } },
        _sum: { totalCost: true },
        _count: { id: true },
      }),
      this.prisma.wastageRecord.aggregate({
        where: {
          restaurantId,
          wastedAt: { gte: lastWeekStart, lt: weekStart },
        },
        _sum: { totalCost: true },
      }),
      this.prisma.wastageRecord.aggregate({
        where: {
          restaurantId,
          wastedAt: { gte: lastMonthStart, lt: monthStart },
        },
        _sum: { totalCost: true },
      }),
      this.prisma.wastageRecord.groupBy({
        by: ["reason"],
        where: { restaurantId, wastedAt: { gte: todayStart } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 1,
      }),
    ]);

    const todayCost = Number(todayData._sum.totalCost || 0);
    const weekCost = Number(weekData._sum.totalCost || 0);
    const monthCost = Number(monthData._sum.totalCost || 0);
    const lastWeekCost = Number(lastWeekData._sum.totalCost || 0);
    const lastMonthCost = Number(lastMonthData._sum.totalCost || 0);

    return {
      today: {
        incidents: todayData._count.id,
        totalCost: todayCost,
        topReason: topReasonToday[0]?.reason || null,
      },
      thisWeek: {
        incidents: weekData._count.id,
        totalCost: weekCost,
        avgDailyCost: weekCost / 7,
      },
      thisMonth: {
        incidents: monthData._count.id,
        totalCost: monthCost,
      },
      trends: {
        vsLastWeek:
          lastWeekCost > 0
            ? ((weekCost - lastWeekCost) / lastWeekCost) * 100
            : 0,
        vsLastMonth:
          lastMonthCost > 0
            ? ((monthCost - lastMonthCost) / lastMonthCost) * 100
            : 0,
      },
    };
  }

  async getReport(restaurantId: string, period: "week" | "month" = "week") {
    const now = new Date();
    const startDate = period === "week" ? startOfWeek(now) : startOfMonth(now);

    const where: Prisma.WastageRecordWhereInput = {
      restaurantId,
      wastedAt: { gte: startDate },
    };

    const [totalData, byReason, topItems] = await Promise.all([
      this.prisma.wastageRecord.aggregate({
        where,
        _sum: { totalCost: true, quantity: true },
        _count: { id: true },
      }),
      this.prisma.wastageRecord.groupBy({
        by: ["reason"],
        where,
        _sum: { totalCost: true },
        _count: { id: true },
        orderBy: { _sum: { totalCost: "desc" } },
      }),
      this.prisma.wastageRecord.groupBy({
        by: ["inventoryItemId"],
        where,
        _sum: { totalCost: true, quantity: true },
        _count: { id: true },
        orderBy: { _sum: { totalCost: "desc" } },
        take: 10,
      }),
    ]);

    // Get item details for top items
    const itemIds = topItems
      .map((t) => t.inventoryItemId)
      .filter((id): id is string => !!id);
    const items = await this.prisma.inventoryItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true, unit: true },
    });

    const itemsMap = new Map(items.map((i) => [i.id, i]));

    return {
      period: {
        start: format(startDate, "yyyy-MM-dd"),
        end: format(now, "yyyy-MM-dd"),
        label: period,
      },
      summary: {
        totalIncidents: totalData._count.id,
        totalCost: Number(totalData._sum.totalCost || 0),
        totalQuantity: Number(totalData._sum.quantity || 0),
      },
      breakdown: {
        byReason: byReason.map((r) => ({
          reason: r.reason,
          count: r._count.id,
          cost: Number(r._sum.totalCost || 0),
        })),
      },
      topItems: topItems.map((t) => {
        const item = t.inventoryItemId ? itemsMap.get(t.inventoryItemId) : null;
        return {
          name: item?.name || "Unknown",
          count: t._count.id,
          totalCost: Number(t._sum.totalCost || 0),
          totalQuantity: Number(t._sum.quantity || 0),
          unit: item?.unit || "",
        };
      }),
    };
  }

  // ============================================
  // CRON JOBS
  // ============================================

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailySummary() {
    this.logger.log("Generating daily wastage summary...");

    const restaurants = await this.prisma.restaurant.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const yesterday = subDays(new Date(), 1);
    const dayStart = startOfDay(yesterday);
    const dayEnd = endOfDay(yesterday);

    for (const restaurant of restaurants) {
      try {
        const data = await this.prisma.wastageRecord.aggregate({
          where: {
            restaurantId: restaurant.id,
            wastedAt: { gte: dayStart, lte: dayEnd },
          },
          _sum: { totalCost: true },
          _count: { id: true },
        });

        this.logger.log(
          `Restaurant ${restaurant.id}: ${data._count.id} incidents, $${Number(data._sum.totalCost || 0).toFixed(2)}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to generate summary for ${restaurant.id}: ${error.message}`,
        );
      }
    }
  }
}
