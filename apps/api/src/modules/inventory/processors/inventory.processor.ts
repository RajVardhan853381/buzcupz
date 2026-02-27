import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Processor('inventory')
export class InventoryProcessor extends WorkerHost {
    private readonly logger = new Logger(InventoryProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notifications: NotificationsService,
    ) {
        super();
    }

    async process(job: Job): Promise<any> {
        this.logger.log(`Processing job: ${job.name} (ID: ${job.id})`);

        switch (job.name) {
            case 'alert-notification':
                return this.handleAlertNotification(job.data);
            case 'low-stock-report':
                return this.handleLowStockReport(job.data);
            default:
                this.logger.warn(`Unknown job type: ${job.name}`);
        }
    }

    private async handleAlertNotification(data: any) {
        const { alert, restaurantId } = data;

        // Get restaurant managers
        const managers = await this.prisma.user.findMany({
            where: {
                restaurantId,
                role: { in: ['ADMIN', 'MANAGER'] },
                isActive: true,
            },
            select: { email: true, name: true },
        });

        this.logger.log(`Alert notification: ${alert.message} - Notifying ${managers.length} managers`);
    }

    private async handleLowStockReport(data: any) {
        const { restaurantId, items } = data;

        this.logger.log(`Low stock report: ${items.length} items need attention`);
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job) {
        this.logger.log(`Job ${job.name} (${job.id}) completed`);
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job, error: Error) {
        this.logger.error(`Job ${job.name} (${job.id}) failed: ${error.message}`);
    }
}
