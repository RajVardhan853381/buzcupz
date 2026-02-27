import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ReservationsService } from '../reservations.service';
import { format } from 'date-fns';

interface AutoConfirmJobData {
    reservationId: string;
    restaurantId: string;
}

interface ReminderJobData {
    reservationId: string;
    restaurantId: string;
}

interface CancellationJobData {
    reservationId: string;
}

interface TableCleanupJobData {
    tableId: string;
    restaurantId: string;
}

@Processor('reservations')
export class ReservationProcessor extends WorkerHost {
    private readonly logger = new Logger(ReservationProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notifications: NotificationsService,
        private readonly reservations: ReservationsService,
    ) {
        super();
    }

    async process(job: Job): Promise<any> {
        this.logger.log(`Processing job: ${job.name} (ID: ${job.id})`);

        switch (job.name) {
            case 'auto-confirm':
                return this.handleAutoConfirm(job.data as AutoConfirmJobData);
            case 'send-reminder':
                return this.handleSendReminder(job.data as ReminderJobData);
            case 'send-cancellation':
                return this.handleSendCancellation(job.data as CancellationJobData);
            case 'table-cleanup':
                return this.handleTableCleanup(job.data as TableCleanupJobData);
            default:
                this.logger.warn(`Unknown job type: ${job.name}`);
        }
    }

    private async handleAutoConfirm(data: AutoConfirmJobData) {
        const { reservationId, restaurantId } = data;

        try {
            const reservation = await this.prisma.reservation.findUnique({
                where: { id: reservationId },
                include: {
                    table: true,
                    restaurant: { select: { name: true, phone: true, address: true } },
                },
            });

            if (!reservation) {
                this.logger.warn(`Reservation ${reservationId} not found for auto-confirm`);
                return;
            }

            if (reservation.status !== 'PENDING') {
                this.logger.log(`Reservation ${reservationId} is not PENDING, skipping`);
                return;
            }

            // Confirm the reservation
            await this.reservations.confirm(reservationId, restaurantId);

            // Send confirmation email/notification
            await this.notifications.sendReservationConfirmation({
                customerName: reservation.customerName,
                customerEmail: reservation.customerEmail,
                confirmationCode: reservation.confirmationCode,
                date: format(new Date(reservation.date), 'EEEE, MMMM d, yyyy'),
                time: format(new Date(reservation.startTime), 'h:mm a'),
                partySize: reservation.partySize,
                tableNumber: reservation.table?.number || undefined,
                restaurant: reservation.restaurant,
                specialRequests: reservation.specialRequests,
            });

            this.logger.log(`Auto-confirmed and notified: ${reservation.confirmationCode}`);
        } catch (error) {
            this.logger.error(`Auto-confirm failed for ${reservationId}: ${error.message}`);
            throw error;
        }
    }

    private async handleSendReminder(data: ReminderJobData) {
        const { reservationId } = data;

        try {
            const reservation = await this.prisma.reservation.findUnique({
                where: { id: reservationId },
                include: {
                    table: true,
                    restaurant: { select: { name: true, phone: true, address: true } },
                },
            });

            if (!reservation) {
                this.logger.warn(`Reservation ${reservationId} not found for reminder`);
                return;
            }

            if (!['CONFIRMED', 'REMINDED'].includes(reservation.status)) {
                this.logger.log(`Reservation ${reservationId} status is ${reservation.status}, skipping reminder`);
                return;
            }

            // Send reminder notification
            await this.notifications.sendReservationReminder({
                customerName: reservation.customerName,
                customerEmail: reservation.customerEmail,
                confirmationCode: reservation.confirmationCode,
                date: format(new Date(reservation.date), 'EEEE, MMMM d, yyyy'),
                time: format(new Date(reservation.startTime), 'h:mm a'),
                partySize: reservation.partySize,
                restaurant: reservation.restaurant,
            });

            // Update status to REMINDED
            await this.prisma.reservation.update({
                where: { id: reservationId },
                data: {
                    status: 'REMINDED',
                    reminderSentAt: new Date(),
                },
            });

            this.logger.log(`Reminder sent for: ${reservation.confirmationCode}`);
        } catch (error) {
            this.logger.error(`Reminder failed for ${reservationId}: ${error.message}`);
            throw error;
        }
    }

    private async handleSendCancellation(data: CancellationJobData) {
        const { reservationId } = data;

        try {
            const reservation = await this.prisma.reservation.findUnique({
                where: { id: reservationId },
                include: {
                    restaurant: { select: { name: true, phone: true } },
                },
            });

            if (!reservation) {
                return;
            }

            await this.notifications.sendReservationCancellation({
                customerName: reservation.customerName,
                customerEmail: reservation.customerEmail,
                confirmationCode: reservation.confirmationCode,
                date: format(new Date(reservation.date), 'EEEE, MMMM d, yyyy'),
                time: format(new Date(reservation.startTime), 'h:mm a'),
                restaurant: reservation.restaurant,
                reason: reservation.cancelReason || undefined,
            });

            this.logger.log(`Cancellation notification sent: ${reservation.confirmationCode}`);
        } catch (error) {
            this.logger.error(`Cancellation notification failed: ${error.message}`);
            throw error;
        }
    }

    private async handleTableCleanup(data: TableCleanupJobData) {
        const { tableId } = data;

        try {
            const table = await this.prisma.table.findUnique({
                where: { id: tableId },
            });

            if (table && table.status === 'CLEANING') {
                await this.prisma.table.update({
                    where: { id: tableId },
                    data: { status: 'AVAILABLE' },
                });

                this.logger.log(`Table ${table.number} marked as AVAILABLE after cleanup`);
            }
        } catch (error) {
            this.logger.error(`Table cleanup failed: ${error.message}`);
        }
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job) {
        this.logger.log(`Job ${job.name} (${job.id}) completed successfully`);
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job, error: Error) {
        this.logger.error(`Job ${job.name} (${job.id}) failed: ${error.message}`);
    }
}
