
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/database/prisma.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class ReportTasksService {
    private readonly logger = new Logger(ReportTasksService.name);

    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    /**
     * Generate and send daily summary reports
     * Runs every day at 11 PM
     */
    @Cron('0 23 * * *')
    async generateDailySummary() {
        this.logger.log('Generating daily summary reports...');

        const restaurants = await this.prisma.restaurant.findMany({
            where: { isActive: true },
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        for (const restaurant of restaurants) {
            try {
                const summary = await this.generateRestaurantDailySummary(
                    restaurant.id,
                    today,
                    tomorrow,
                );

                await this.notificationsService.sendToRestaurant(restaurant.id, {
                    type: 'daily_summary',
                    data: summary,
                });

                this.logger.log(`Daily summary generated for ${restaurant.name}`);
            } catch (error) {
                this.logger.error(
                    `Failed to generate summary for ${restaurant.name}`,
                    error.stack,
                );
            }
        }
    }

    /**
     * Check for low inventory and send alerts
     * Runs every 4 hours
     */
    @Cron('0 */4 * * *')
    async checkLowInventory() {
        this.logger.log('Checking for low inventory...');

        try {
            const lowStockItems = await this.prisma.inventoryItem.findMany({
                where: { isLowStock: true },
                include: { restaurant: true }
            });

            for (const item of lowStockItems) {
                await this.notificationsService.sendToRestaurant(item.restaurantId, {
                    type: 'low_stock_alert',
                    data: { itemName: item.name, current: item.currentStock, min: item.minimumStock }
                });
            }
        } catch (error) {
            this.logger.error('Error checking inventory', error.stack);
        }
    }

    // ==================== HELPER METHODS ====================

    private async generateRestaurantDailySummary(
        restaurantId: string,
        startDate: Date,
        endDate: Date,
    ) {
        // Get order statistics
        const orders = await this.prisma.order.findMany({
            where: {
                restaurantId,
                createdAt: { gte: startDate, lt: endDate },
            },
        });

        const completedOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED);
        const cancelledOrders = orders.filter((o) => o.status === OrderStatus.CANCELLED);

        const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

        // Get reservation statistics
        const reservations = await this.prisma.reservation.findMany({
            where: {
                restaurantId,
                date: { gte: startDate, lt: endDate },
            },
        });

        const totalGuests = reservations.reduce((sum, r) => sum + r.partySize, 0);

        // Calculate peak hours
        const hourCounts = new Map<number, number>();
        orders.forEach((order) => {
            const hour = new Date(order.createdAt).getHours();
            hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
        });

        let peakHour = 0;
        let maxCount = 0;
        hourCounts.forEach((count, hour) => {
            if (count > maxCount) {
                maxCount = count;
                peakHour = hour;
            }
        });

        return {
            date: startDate.toISOString().split('T')[0],
            orders: {
                total: orders.length,
                completed: completedOrders.length,
                cancelled: cancelledOrders.length,
                completionRate:
                    orders.length > 0
                        ? ((completedOrders.length / orders.length) * 100).toFixed(1)
                        : 0,
            },
            revenue: {
                total: totalRevenue.toFixed(2),
                average: averageOrderValue.toFixed(2),
            },
            reservations: {
                total: reservations.length,
                totalGuests,
            },
            peakHour: `${peakHour}:00 - ${peakHour + 1}:00`,
        };
    }
}
