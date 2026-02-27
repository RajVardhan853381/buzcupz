import {
    Injectable,
    Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { AnalyticsQueryDto, DateRange } from './dto/analytics-query.dto';
import { BestSellersQueryDto, SortByMetric } from './dto/best-sellers-query.dto';
import { Prisma } from '@prisma/client';
import {
    format,
    parseISO,
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    subDays,
    subWeeks,
    subMonths,
    differenceInDays,
    getDay,
} from 'date-fns';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ============================================
    // DASHBOARD OVERVIEW
    // ============================================

    async getDashboard(restaurantId: string, query: AnalyticsQueryDto) {
        const { startDate, endDate } = this.getDateRange(query.dateRange, query.startDate, query.endDate);

        // Get comparison period
        const daysDiff = differenceInDays(endDate, startDate);
        const comparisonStart = subDays(startDate, daysDiff + 1);
        const comparisonEnd = subDays(startDate, 1);

        // Current period data
        const currentData = await this.getOrdersData(restaurantId, startDate, endDate);

        // Comparison period data
        const comparisonData = await this.getOrdersData(restaurantId, comparisonStart, comparisonEnd);

        // Calculate metrics
        const revenue = {
            total: currentData.totalRevenue,
            net: currentData.netRevenue,
            tax: currentData.totalTax,
            tips: currentData.totalTips,
            discounts: currentData.totalDiscount,
            change: currentData.totalRevenue - comparisonData.totalRevenue,
            changePercent: comparisonData.totalRevenue > 0
                ? ((currentData.totalRevenue - comparisonData.totalRevenue) / comparisonData.totalRevenue) * 100
                : 0,
        };

        const orders = {
            total: currentData.orderCount,
            avgValue: currentData.orderCount > 0 ? currentData.totalRevenue / currentData.orderCount : 0,
            avgItems: currentData.orderCount > 0 ? currentData.itemCount / currentData.orderCount : 0,
            change: currentData.orderCount - comparisonData.orderCount,
            changePercent: comparisonData.orderCount > 0
                ? ((currentData.orderCount - comparisonData.orderCount) / comparisonData.orderCount) * 100
                : 0,
        };

        const items = {
            total: currentData.itemCount,
            avgPerOrder: orders.avgItems,
        };

        // Customer metrics (simplified)
        const uniqueCustomers = await this.prisma.order.groupBy({
            by: ['customerEmail'],
            where: {
                restaurantId,
                status: 'COMPLETED',
                createdAt: { gte: startDate, lte: endDate },
                customerEmail: { not: null },
            },
        });

        const customers = {
            unique: uniqueCustomers.length,
            new: 0, // Simplified
            returning: 0,
            returnRate: 0,
        };

        return {
            revenue,
            orders,
            items,
            customers,
            byOrderType: currentData.byOrderType,
        };
    }

    // ============================================
    // BEST SELLERS
    // ============================================

    async getBestSellers(restaurantId: string, query: BestSellersQueryDto) {
        const { startDate, endDate } = this.getDateRange(
            query.dateRange || DateRange.LAST_30_DAYS,
            query.startDate,
            query.endDate
        );

        // Get comparison period if requested
        const daysDiff = differenceInDays(endDate, startDate);
        const comparisonStart = subDays(startDate, daysDiff + 1);
        const comparisonEnd = subDays(startDate, 1);

        // Get current period sales
        const itemSales = await this.prisma.orderItem.groupBy({
            by: ['menuItemId'],
            where: {
                order: {
                    restaurantId,
                    status: 'COMPLETED',
                    createdAt: { gte: startDate, lte: endDate },
                },
            },
            _sum: {
                quantity: true,
                subtotal: true,
            },
            _count: {
                orderId: true,
            },
        });

        // Get item details
        const menuItemIds = itemSales.map((s) => s.menuItemId);
        const menuItems = await this.prisma.menuItem.findMany({
            where: { id: { in: menuItemIds } },
            include: {
                category: { select: { id: true, name: true } },
            },
        });

        const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

        // Get comparison data if requested
        let comparisonMap = new Map<string, { quantity: number; revenue: number }>();
        if (query.includeComparison) {
            const comparisonSales = await this.prisma.orderItem.groupBy({
                by: ['menuItemId'],
                where: {
                    order: {
                        restaurantId,
                        status: 'COMPLETED',
                        createdAt: { gte: comparisonStart, lte: comparisonEnd },
                    },
                },
                _sum: {
                    quantity: true,
                    subtotal: true,
                },
            });

            comparisonSales.forEach((s) => {
                comparisonMap.set(s.menuItemId, {
                    quantity: s._sum.quantity || 0,
                    revenue: Number(s._sum.subtotal || 0),
                });
            });
        }

        // Build best sellers list
        let bestSellers = itemSales.map((sale) => {
            const item = menuItemMap.get(sale.menuItemId);
            if (!item) return null;

            const quantity = sale._sum.quantity || 0;
            const revenue = Number(sale._sum.subtotal || 0);
            const cost = Number(item.price) * 0.3 * quantity; // Estimate 30% food cost
            const profit = revenue - cost;
            const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
            const orderFrequency = sale._count.orderId || 0;

            const comparison = comparisonMap.get(sale.menuItemId);

            return {
                id: item.id,
                name: item.name,
                category: item.category?.name || 'Uncategorized',
                categoryId: item.categoryId,
                image: item.image || undefined,
                quantity,
                revenue,
                cost,
                profit,
                profitMargin,
                orderFrequency,
                rank: 0,
                change: comparison ? {
                    quantity: quantity - comparison.quantity,
                    revenue: revenue - comparison.revenue,
                    quantityPercent: comparison.quantity > 0
                        ? ((quantity - comparison.quantity) / comparison.quantity) * 100
                        : 0,
                    revenuePercent: comparison.revenue > 0
                        ? ((revenue - comparison.revenue) / comparison.revenue) * 100
                        : 0,
                } : undefined,
            };
        }).filter(Boolean);

        // Sort based on selected metric
        switch (query.sortBy) {
            case SortByMetric.QUANTITY:
                bestSellers.sort((a, b) => b.quantity - a.quantity);
                break;
            case SortByMetric.PROFIT:
                bestSellers.sort((a, b) => b.profit - a.profit);
                break;
            default:
                bestSellers.sort((a, b) => b.revenue - a.revenue);
        }

        // Assign ranks and limit
        bestSellers = bestSellers.slice(0, query.limit).map((item, index) => ({
            ...item,
            rank: index + 1,
        }));

        return bestSellers;
    }

    // ============================================
    // WORST SELLERS
    // ============================================

    async getWorstSellers(restaurantId: string, query: BestSellersQueryDto) {
        const bestSellers = await this.getBestSellers(restaurantId, {
            ...query,
            sortBy: SortByMetric.REVENUE,
            limit: 100,
        });

        return bestSellers
            .slice(-Math.min(query.limit || 10, bestSellers.length))
            .reverse();
    }

    // ============================================
    // CATEGORY PERFORMANCE
    // ============================================

    async getCategoryPerformance(restaurantId: string, query: AnalyticsQueryDto) {
        const { startDate, endDate } = this.getDateRange(query.dateRange, query.startDate, query.endDate);

        // Get comparison period
        const daysDiff = differenceInDays(endDate, startDate);
        const comparisonStart = subDays(startDate, daysDiff + 1);
        const comparisonEnd = subDays(startDate, 1);

        // Current period by category
        const currentData = await this.prisma.$queryRaw<any[]>`
      SELECT 
        c.id as "categoryId",
        c.name as "categoryName",
        COUNT(DISTINCT oi.id)::int as "itemsSold",
        SUM(oi.subtotal)::float as revenue
      FROM "OrderItem" oi
      JOIN "MenuItem" m ON oi."menuItemId" = m.id
      JOIN "Category" c ON m."categoryId" = c.id
      JOIN "Order" o ON oi."orderId" = o.id
      WHERE o."restaurantId" = ${restaurantId}
        AND o.status = 'COMPLETED'
        AND o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `;

        // Comparison period
        const comparisonData = await this.prisma.$queryRaw<any[]>`
      SELECT 
        c.id as "categoryId",
        SUM(oi.subtotal)::float as revenue
      FROM "OrderItem" oi
      JOIN "MenuItem" m ON oi."menuItemId" = m.id
      JOIN "Category" c ON m."categoryId" = c.id
      JOIN "Order" o ON oi."orderId" = o.id
      WHERE o."restaurantId" = ${restaurantId}
        AND o.status = 'COMPLETED'
        AND o."createdAt" >= ${comparisonStart}
        AND o."createdAt" <= ${comparisonEnd}
      GROUP BY c.id
    `;

        const comparisonMap = new Map(comparisonData.map((d) => [d.categoryId, d.revenue]));
        const totalRevenue = currentData.reduce((sum, d) => sum + d.revenue, 0);

        return currentData.map((cat) => {
            const prevRevenue = comparisonMap.get(cat.categoryId) || 0;
            const change = prevRevenue > 0 ? ((cat.revenue - prevRevenue) / prevRevenue) * 100 : 0;

            return {
                id: cat.categoryId,
                name: cat.categoryName,
                itemsSold: cat.itemsSold,
                revenue: cat.revenue,
                profit: cat.revenue * 0.65, // Estimated 65% margin
                share: totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0,
                change,
            };
        });
    }

    // ============================================
    // SALES TRENDS
    // ============================================

    async getSalesTrend(restaurantId: string, days: number = 30) {
        const endDate = endOfDay(new Date());
        const startDate = startOfDay(subDays(endDate, days - 1));

        const dailyData = await this.prisma.$queryRaw<any[]>`
      SELECT 
        DATE("createdAt") as date,
        SUM(total)::float as revenue,
        COUNT(*)::int as orders,
        SUM((
          SELECT SUM(quantity)::int
          FROM "OrderItem"
          WHERE "orderId" = "Order".id
        )) as items
      FROM "Order"
      WHERE "restaurantId" = ${restaurantId}
        AND status = 'COMPLETED'
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY DATE("createdAt")
      ORDER BY date
    `;

        return dailyData.map((d) => ({
            date: format(new Date(d.date), 'yyyy-MM-dd'),
            label: format(new Date(d.date), 'MMM d'),
            revenue: d.revenue || 0,
            orders: d.orders || 0,
            items: d.items || 0,
        }));
    }

    // ============================================
    // HOURLY PATTERNS
    // ============================================

    async getHourlyPatterns(restaurantId: string) {
        const thirtyDaysAgo = subDays(new Date(), 30);

        const hourlyData = await this.prisma.$queryRaw<any[]>`
      SELECT 
        EXTRACT(HOUR FROM "createdAt")::int as hour,
        COUNT(*)::int as "orderCount",
        AVG(total)::float as "avgRevenue"
      FROM "Order"
      WHERE "restaurantId" = ${restaurantId}
        AND status = 'COMPLETED'
        AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY EXTRACT(HOUR FROM "createdAt")
      ORDER BY hour
    `;

        return hourlyData.map((d) => ({
            hour: d.hour,
            label: this.formatHour(d.hour),
            avgRevenue: d.avgRevenue || 0,
            avgOrders: d.orderCount / 30, // Average per day
        }));
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private getDateRange(
        range: DateRange,
        customStart?: string,
        customEnd?: string
    ): { startDate: Date; endDate: Date } {
        const now = new Date();

        if (range === DateRange.CUSTOM && customStart && customEnd) {
            return {
                startDate: startOfDay(parseISO(customStart)),
                endDate: endOfDay(parseISO(customEnd)),
            };
        }

        switch (range) {
            case DateRange.TODAY:
                return { startDate: startOfDay(now), endDate: endOfDay(now) };
            case DateRange.YESTERDAY:
                const yesterday = subDays(now, 1);
                return { startDate: startOfDay(yesterday), endDate: endOfDay(yesterday) };
            case DateRange.LAST_7_DAYS:
                return { startDate: startOfDay(subDays(now, 6)), endDate: endOfDay(now) };
            case DateRange.LAST_30_DAYS:
                return { startDate: startOfDay(subDays(now, 29)), endDate: endOfDay(now) };
            case DateRange.THIS_WEEK:
                return { startDate: startOfWeek(now), endDate: endOfWeek(now) };
            case DateRange.LAST_WEEK:
                const lastWeek = subWeeks(now, 1);
                return { startDate: startOfWeek(lastWeek), endDate: endOfWeek(lastWeek) };
            case DateRange.THIS_MONTH:
                return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
            case DateRange.LAST_MONTH:
                const lastMonth = subMonths(now, 1);
                return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
            case DateRange.THIS_YEAR:
                return { startDate: startOfYear(now), endDate: endOfYear(now) };
            default:
                return { startDate: startOfDay(subDays(now, 6)), endDate: endOfDay(now) };
        }
    }

    private async getOrdersData(restaurantId: string, startDate: Date, endDate: Date) {
        const orders = await this.prisma.order.aggregate({
            where: {
                restaurantId,
                status: 'COMPLETED',
                createdAt: { gte: startDate, lte: endDate },
            },
            _sum: {
                total: true,
                subtotal: true,
                tax: true,
                tip: true,
                discount: true,
            },
            _count: { id: true },
        });

        const items = await this.prisma.orderItem.aggregate({
            where: {
                order: {
                    restaurantId,
                    status: 'COMPLETED',
                    createdAt: { gte: startDate, lte: endDate },
                },
            },
            _sum: { quantity: true },
        });

        // By order type
        const byType = await this.prisma.order.groupBy({
            by: ['orderType'],
            where: {
                restaurantId,
                status: 'COMPLETED',
                createdAt: { gte: startDate, lte: endDate },
            },
            _sum: { total: true },
            _count: { id: true },
        });

        const typeMap = new Map(byType.map((t) => [t.orderType, t]));

        return {
            totalRevenue: Number(orders._sum.total || 0),
            netRevenue: Number(orders._sum.subtotal || 0),
            totalTax: Number(orders._sum.tax || 0),
            totalTips: Number(orders._sum.tip || 0),
            totalDiscount: Number(orders._sum.discount || 0),
            orderCount: orders._count.id,
            itemCount: items._sum.quantity || 0,
            byOrderType: {
                dineIn: {
                    orders: typeMap.get('DINE_IN')?._count.id || 0,
                    revenue: Number(typeMap.get('DINE_IN')?._sum.total || 0),
                },
                takeout: {
                    orders: typeMap.get('TAKEOUT')?._count.id || 0,
                    revenue: Number(typeMap.get('TAKEOUT')?._sum.total || 0),
                },
                delivery: {
                    orders: typeMap.get('DELIVERY')?._count.id || 0,
                    revenue: Number(typeMap.get('DELIVERY')?._sum.total || 0),
                },
            },
        };
    }

    private formatHour(hour: number): string {
        if (hour === 0) return '12 AM';
        if (hour === 12) return '12 PM';
        if (hour < 12) return `${hour} AM`;
        return `${hour - 12} PM`;
    }

    // ============================================
    // CRON JOBS (Placeholder - can be expanded)
    // ============================================

    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async aggregateDailyData() {
        this.logger.log('Daily analytics aggregation running...');
        // This can be expanded to pre-calculate and store daily metrics
    }
}
