import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "@/database/prisma.service";
import { NotificationsService } from "@/modules/notifications/notifications.service";
import { ReservationStatus } from "@prisma/client";

@Injectable()
export class ReservationTasksService {
  private readonly logger = new Logger(ReservationTasksService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Send reminders 24 hours before reservation
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async send24HourReminders() {
    this.logger.log("Running 24-hour reminder check...");

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    try {
      const reservations = await this.prisma.reservation.findMany({
        where: {
          status: {
            in: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING],
          },
          date: {
            gte: in24Hours,
            lt: in25Hours,
          },
          reminderSent24h: false,
        },
        include: { restaurant: true },
      });

      this.logger.log(
        `Found ${reservations.length} reservations needing 24h reminder`,
      );

      for (const reservation of reservations) {
        try {
          await this.send24HourReminder(reservation);

          await this.prisma.reservation.update({
            where: { id: reservation.id },
            data: { reminderSent24h: true, reminderSentAt: new Date() },
          });

          this.logger.log(
            `24h reminder sent for reservation ${reservation.id}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to send 24h reminder for reservation ${reservation.id}`,
            error.stack,
          );
        }
      }
    } catch (error) {
      this.logger.error("Error in 24-hour reminder job", error.stack);
    }
  }

  /**
   * Send reminders 1 hour before reservation
   * Runs every 15 minutes
   */
  @Cron("0 */15 * * * *")
  async send1HourReminders() {
    this.logger.log("Running 1-hour reminder check...");

    const now = new Date();
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    const in75Minutes = new Date(now.getTime() + 75 * 60 * 1000);

    try {
      const reservations = await this.prisma.reservation.findMany({
        where: {
          status: {
            in: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING],
          },
          // Using startTime if available, otherwise date
          startTime: {
            gte: in1Hour,
            lt: in75Minutes,
          },
          reminderSent1h: false,
        },
        include: { restaurant: true },
      });

      this.logger.log(
        `Found ${reservations.length} reservations needing 1h reminder`,
      );

      for (const reservation of reservations) {
        try {
          await this.send1HourReminder(reservation);

          await this.prisma.reservation.update({
            where: { id: reservation.id },
            data: { reminderSent1h: true, secondReminderSentAt: new Date() },
          });

          this.logger.log(`1h reminder sent for reservation ${reservation.id}`);
        } catch (error) {
          this.logger.error(
            `Failed to send 1h reminder for reservation ${reservation.id}`,
            error.stack,
          );
        }
      }
    } catch (error) {
      this.logger.error("Error in 1-hour reminder job", error.stack);
    }
  }

  /**
   * Auto-cancel no-shows (30 minutes past reservation time)
   * Runs every 10 minutes
   */
  @Cron("0 */10 * * * *")
  async handleNoShows() {
    this.logger.log("Checking for no-shows...");

    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    try {
      const noShows = await this.prisma.reservation.findMany({
        where: {
          status: {
            in: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING],
          },
          startTime: { lt: thirtyMinutesAgo },
        },
        include: { restaurant: true },
      });

      this.logger.log(`Found ${noShows.length} potential no-shows`);

      for (const reservation of noShows) {
        try {
          await this.prisma.reservation.update({
            where: { id: reservation.id },
            data: { status: ReservationStatus.NO_SHOW, noShowAt: new Date() },
          });

          // Notify restaurant staff
          await this.notifyNoShow(reservation);

          this.logger.log(`Marked reservation ${reservation.id} as no-show`);
        } catch (error) {
          this.logger.error(
            `Failed to process no-show for reservation ${reservation.id}`,
            error.stack,
          );
        }
      }
    } catch (error) {
      this.logger.error("Error in no-show handler", error.stack);
    }
  }

  /**
   * Auto-complete reservations that have been seated for 2+ hours
   * Runs every 30 minutes
   */
  @Cron("0 */30 * * * *")
  async autoCompleteReservations() {
    this.logger.log("Auto-completing old seated reservations...");

    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    try {
      const seatedReservations = await this.prisma.reservation.findMany({
        where: {
          status: ReservationStatus.SEATED,
          seatedAt: { lt: twoHoursAgo },
        },
      });

      this.logger.log(
        `Found ${seatedReservations.length} reservations to auto-complete`,
      );

      for (const reservation of seatedReservations) {
        await this.prisma.reservation.update({
          where: { id: reservation.id },
          data: {
            status: ReservationStatus.COMPLETED,
            completedAt: new Date(),
          },
        });
        this.logger.log(`Auto-completed reservation ${reservation.id}`);
      }
    } catch (error) {
      this.logger.error("Error in auto-complete job", error.stack);
    }
  }

  /**
   * Clean up old reservations (archive/delete after 90 days)
   * Runs daily at 3 AM
   */
  @Cron("0 3 * * *")
  async cleanupOldReservations() {
    this.logger.log("Cleaning up old reservations...");

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    try {
      // Soft delete - just mark as archived
      const result = await this.prisma.reservation.updateMany({
        where: {
          date: { lt: ninetyDaysAgo },
          status: {
            in: [
              ReservationStatus.COMPLETED,
              ReservationStatus.CANCELLED,
              ReservationStatus.NO_SHOW,
            ],
          },
          isArchived: false,
        },
        data: { isArchived: true },
      });

      this.logger.log(`Archived ${result.count} old reservations`);
    } catch (error) {
      this.logger.error("Error cleaning up old reservations", error.stack);
    }
  }

  // ==================== HELPER METHODS ====================

  private async send24HourReminder(reservation: any) {
    const message = this.format24HourReminder(reservation);

    if (reservation.guestEmail) {
      await this.notificationsService.sendEmail({
        to: reservation.guestEmail,
        subject: `Reminder: Your reservation tomorrow at ${reservation.restaurant?.name}`,
        html: message.email,
      });
    }

    if (reservation.guestPhone) {
      await this.notificationsService.sendSMS({
        to: reservation.guestPhone,
        message: message.sms,
      });
    }
  }

  private async send1HourReminder(reservation: any) {
    const message = this.format1HourReminder(reservation);

    if (reservation.guestPhone) {
      await this.notificationsService.sendSMS({
        to: reservation.guestPhone,
        message: message.sms,
      });
    }
  }

  private async notifyNoShow(reservation: any) {
    await this.notificationsService.sendToRestaurant(reservation.restaurantId, {
      type: "reservation_no_show",
      data: {
        reservationId: reservation.id,
        customerName: reservation.guestName,
        time: reservation.startTime,
        partySize: reservation.partySize,
      },
    });
  }

  private format24HourReminder(reservation: any) {
    const date = new Date(reservation.startTime);
    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    return {
      email: `
        <h2>Reservation Reminder</h2>
        <p>Hello ${reservation.guestName},</p>
        <p>This is a reminder about your upcoming reservation:</p>
        <ul>
          <li><strong>Restaurant:</strong> ${reservation.restaurant?.name}</li>
          <li><strong>Date:</strong> ${formattedDate}</li>
          <li><strong>Time:</strong> ${formattedTime}</li>
          <li><strong>Party Size:</strong> ${reservation.partySize} guests</li>
        </ul>
        <p>If you need to modify or cancel your reservation, please contact us as soon as possible.</p>
        <p>We look forward to seeing you!</p>
      `,
      sms: `Reminder: Your reservation at ${reservation.restaurant?.name} is tomorrow at ${formattedTime} for ${reservation.partySize} guests. Reply CANCEL to cancel.`,
    };
  }

  private format1HourReminder(reservation: any) {
    const date = new Date(reservation.startTime);
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    return {
      sms: `Your table at ${reservation.restaurant?.name} is ready in 1 hour (${formattedTime}). See you soon!`,
    };
  }
}
