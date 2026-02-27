import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface ReservationConfirmationData {
  customerName: string;
  customerEmail: string;
  confirmationCode: string;
  date: string;
  time: string;
  partySize: number;
  tableNumber?: string;
  restaurant: {
    name: string;
    phone: string;
    address: string;
  };
  specialRequests?: string;
}

interface ReservationReminderData {
  customerName: string;
  customerEmail: string;
  confirmationCode: string;
  date: string;
  time: string;
  partySize: number;
  restaurant: {
    name: string;
    phone: string;
    address: string;
  };
}

interface ReservationCancellationData {
  customerName: string;
  customerEmail: string;
  confirmationCode: string;
  date: string;
  time: string;
  restaurant: {
    name: string;
    phone: string;
  };
  reason?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly config: ConfigService) {}

  async sendReservationConfirmation(
    data: ReservationConfirmationData,
  ): Promise<void> {
    const emailContent = `
╔══════════════════════════════════════════════════════════════════════╗
║                    RESERVATION CONFIRMATION                          ║
╠══════════════════════════════════════════════════════════════════════╣
║  Dear ${data.customerName},                                         
║                                                                      ║
║  Your reservation has been confirmed!                               
║                                                                      ║
║  📍  ${data.restaurant.name}                                        
║  📅  ${data.date}                                                   
║  🕐  ${data.time}                                                   
║  👥  ${data.partySize} guests                                       
║  🪑  Table ${data.tableNumber || "TBA"}                             
║                                                                      ║
║  Confirmation Code: ${data.confirmationCode}                        
║                                                                      ║
║  📍 ${data.restaurant.address}                                      
║  📞 ${data.restaurant.phone}                                        
${data.specialRequests ? `║  📝 Special Requests: ${data.specialRequests}\n` : ""}║                                                                      ║
║  We look forward to seeing you!                                     
╚══════════════════════════════════════════════════════════════════════╝
    `;

    this.logger.log(emailContent);
    this.logger.log(`✉️  Confirmation email sent to: ${data.customerEmail}`);
  }

  async sendReservationReminder(data: ReservationReminderData): Promise<void> {
    const emailContent = `
╔══════════════════════════════════════════════════════════════════════╗
║                    RESERVATION REMINDER                              ║
╠══════════════════════════════════════════════════════════════════════╣
║  Hi ${data.customerName}! 👋                                        
║                                                                      ║
║  Reminder: Your reservation is coming up!                           
║                                                                      ║
║  📍  ${data.restaurant.name}                                        
║  🕐  TODAY at ${data.time}                                          
║  👥  ${data.partySize} guests                                       
║                                                                      ║
║  Confirmation Code: ${data.confirmationCode}                        
║                                                                      ║
║  See you soon!                                                       
╚══════════════════════════════════════════════════════════════════════╝
    `;

    this.logger.log(emailContent);
    this.logger.log(`⏰ Reminder sent to: ${data.customerEmail}`);
  }

  async sendReservationCancellation(
    data: ReservationCancellationData,
  ): Promise<void> {
    const emailContent = `
╔══════════════════════════════════════════════════════════════════════╗
║                  RESERVATION CANCELLED                               ║
╠══════════════════════════════════════════════════════════════════════╣
║  Dear ${data.customerName},                                         
║                                                                      ║
║  Your reservation has been cancelled:                               
║                                                                      ║
║  📅  ${data.date}                                                   
║  🕐  ${data.time}                                                   
║  🔖  ${data.confirmationCode}                                       
${data.reason ? `║  📝  Reason: ${data.reason}\n` : ""}║                                                                      ║
║  We hope to see you another time!                                   
╚══════════════════════════════════════════════════════════════════════╝
    `;

    this.logger.log(emailContent);
    this.logger.log(`❌ Cancellation notice sent to: ${data.customerEmail}`);
  }
  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    this.logger.log(`📧 Sending EMAIL to ${options.to}`);
    this.logger.log(`Subject: ${options.subject}`);
    this.logger.log(`Body: ${options.html.substring(0, 100)}...`);
  }

  async sendSMS(options: { to: string; message: string }): Promise<void> {
    this.logger.log(`📱 Sending SMS to ${options.to}: "${options.message}"`);
  }

  async sendToRestaurant(
    restaurantId: string,
    notification: { type: string; data: any },
  ): Promise<void> {
    this.logger.log(
      `🏢 Notification for Restaurant ${restaurantId}: [${notification.type}]`,
    );
  }

  async sendToUser(userId: string, notification: any): Promise<void> {
    this.logger.log(`👤 Notification for User ${userId}:`, notification);
  }
}
