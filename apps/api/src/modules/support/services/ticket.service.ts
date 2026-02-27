import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { TicketStatus, TicketPriority, TicketCategory, SenderType } from '@prisma/client';
import { NotificationsService } from '@/modules/notifications/notifications.service';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async createTicket(params: {
    restaurantId?: string;
    userId?: string;
    email: string;
    name: string;
    subject: string;
    description: string;
    category: TicketCategory;
    priority?: TicketPriority;
    attachments?: Array<{ filename: string; fileUrl: string; fileSize: number; mimeType: string }>;
  }) {
    const ticketNumber = await this.generateTicketNumber();

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        restaurantId: params.restaurantId,
        userId: params.userId,
        email: params.email,
        name: params.name,
        subject: params.subject,
        description: params.description,
        category: params.category,
        priority: params.priority || TicketPriority.NORMAL,
        status: TicketStatus.OPEN,
        attachments: params.attachments
          ? {
              create: params.attachments,
            }
          : undefined,
      },
      include: {
        attachments: true,
      },
    });

    // Send confirmation email
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    await this.notifications.sendEmail({
      to: params.email,
      subject: `[Ticket #${ticketNumber}] ${params.subject}`,
      html: this.getTicketCreatedEmailHtml({
        name: params.name,
        ticketNumber,
        subject: params.subject,
        category: params.category,
        priority: params.priority || TicketPriority.NORMAL,
        ticketUrl: `${appUrl}/support/tickets/${ticket.id}`,
      }),
    });

    this.logger.log(`Ticket created: ${ticketNumber}`);

    return ticket;
  }

  async addMessage(params: {
    ticketId: string;
    senderId?: string;
    senderType: SenderType;
    senderName: string;
    senderEmail: string;
    content: string;
    isInternal?: boolean;
    attachments?: Array<{ filename: string; fileUrl: string; fileSize: number; mimeType: string }>;
  }) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: params.ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId: params.ticketId,
        senderId: params.senderId,
        senderType: params.senderType,
        senderName: params.senderName,
        senderEmail: params.senderEmail,
        content: params.content,
        isInternal: params.isInternal || false,
        attachments: params.attachments
          ? {
              create: params.attachments.map((a) => ({
                ...a,
                ticketId: params.ticketId,
              })),
            }
          : undefined,
      },
      include: {
        attachments: true,
      },
    });

    // Update ticket status
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (params.senderType === SenderType.SUPPORT_AGENT && !params.isInternal) {
      if (!ticket.firstResponseAt) {
        updateData.firstResponseAt = new Date();
      }
      updateData.status = TicketStatus.WAITING_ON_CUSTOMER;
    } else if (params.senderType === SenderType.CUSTOMER) {
      if (ticket.status === TicketStatus.WAITING_ON_CUSTOMER) {
        updateData.status = TicketStatus.IN_PROGRESS;
      }
    }

    await this.prisma.supportTicket.update({
      where: { id: params.ticketId },
      data: updateData,
    });

    // Send notification for non-internal messages
    if (!params.isInternal) {
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      if (params.senderType === SenderType.SUPPORT_AGENT) {
        // Notify customer of reply
        await this.notifications.sendEmail({
          to: ticket.email,
          subject: `Re: [Ticket #${ticket.ticketNumber}] ${ticket.subject}`,
          html: this.getTicketReplyEmailHtml({
            name: ticket.name,
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            message: params.content,
            senderName: params.senderName,
            status: updateData.status || ticket.status,
            timestamp: new Date().toLocaleString(),
            ticketUrl: `${appUrl}/support/tickets/${ticket.id}`,
          }),
        });
      }
    }

    return message;
  }

  async updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    resolution?: string,
  ) {
    const updateData: any = { status };

    if (status === TicketStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
      updateData.resolution = resolution;
    } else if (status === TicketStatus.CLOSED) {
      updateData.closedAt = new Date();
    }

    const ticket = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
    });

    
    // await this.emailService.send({
    //   to: ticket.email,
    //   subject: `[Ticket #${ticket.ticketNumber}] Status Updated: ${status}`,
    //   template: 'ticket-status-update',
    //   templateData: {
    //     name: ticket.name,
    //     ticketNumber: ticket.ticketNumber,
    //     status,
    //     resolution,
    //   },
    // });

    return ticket;
  }

  async assignTicket(ticketId: string, agentId: string) {
    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedToId: agentId,
        status: TicketStatus.IN_PROGRESS,
      },
    });
  }

  async getTickets(params: {
    restaurantId?: string;
    userId?: string;
    status?: TicketStatus;
    category?: TicketCategory;
    priority?: TicketPriority;
    assignedToId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = params;

    const where: any = {};

    if (params.restaurantId) where.restaurantId = params.restaurantId;
    if (params.userId) where.userId = params.userId;
    if (params.status) where.status = params.status;
    if (params.category) where.category = params.category;
    if (params.priority) where.priority = params.priority;
    if (params.assignedToId) where.assignedToId = params.assignedToId;
    if (params.search) {
      where.OR = [
        { subject: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { ticketNumber: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          restaurant: { select: { name: true } },
          assignedTo: { select: { name: true, email: true } },
          _count: { select: { messages: true } },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getTicketById(ticketId: string) {
    return this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        restaurant: { select: { name: true, subdomain: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
        assignedTo: { select: { name: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { attachments: true },
        },
        attachments: true,
      },
    });
  }

  async submitSatisfactionRating(
    ticketId: string,
    rating: number,
    feedback?: string,
  ) {
    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        satisfactionRating: rating,
        satisfactionFeedback: feedback,
      },
    });
  }

  private async generateTicketNumber(): Promise<string> {
    const date = new Date();
    const prefix = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const lastTicket = await this.prisma.supportTicket.findFirst({
      where: {
        ticketNumber: { startsWith: prefix },
      },
      orderBy: { ticketNumber: 'desc' },
    });

    const sequence = lastTicket
      ? parseInt(lastTicket.ticketNumber.slice(-4)) + 1
      : 1;

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Helper method to generate ticket created email HTML
   */
  private getTicketCreatedEmailHtml(data: {
    name: string;
    ticketNumber: string;
    subject: string;
    category: string;
    priority: string;
    ticketUrl: string;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">🎫 Support Ticket Created</h1>
          <div style="background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 10px; font-weight: 600;">
            #${data.ticketNumber}
          </div>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <p>Hi <strong>${data.name}</strong>,</p>
          <p>Thank you for contacting CAFEelevate Support. We've received your request!</p>
          <div style="background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <div style="margin-bottom: 12px;"><strong>Ticket Number:</strong> #${data.ticketNumber}</div>
            <div style="margin-bottom: 12px;"><strong>Subject:</strong> ${data.subject}</div>
            <div style="margin-bottom: 12px;"><strong>Category:</strong> ${data.category}</div>
            <div style="margin-bottom: 12px;"><strong>Priority:</strong> ${data.priority}</div>
            <div><strong>Status:</strong> Open - Awaiting Response</div>
          </div>
          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; margin: 20px 0; border-radius: 4px;">
            <strong>⏰ Response Time:</strong> Our team will respond within <strong>24 hours</strong> during business hours.
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.ticketUrl}" style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
              View Ticket Status
            </a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Helper method to generate ticket reply email HTML
   */
  private getTicketReplyEmailHtml(data: {
    name: string;
    ticketNumber: string;
    subject: string;
    message: string;
    senderName: string;
    status: string;
    timestamp: string;
    ticketUrl: string;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">💬 New Reply Received</h1>
          <div style="background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 10px; font-weight: 600;">
            #${data.ticketNumber}
          </div>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <p>Hi <strong>${data.name}</strong>,</p>
          <p>Our support team has responded to your ticket!</p>
          <div style="background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 6px; margin: 20px 0; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; margin-bottom: 12px;">
              <div>
                <span style="font-weight: 600;">${data.senderName}</span>
                <span style="display: inline-block; padding: 2px 8px; background: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 12px; margin-left: 8px;">Support Team</span>
              </div>
              <span style="color: #6b7280; font-size: 13px;">${data.timestamp}</span>
            </div>
            <div style="color: #374151;">${data.message}</div>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.ticketUrl}" style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
              View Full Conversation
            </a>
          </div>
        </div>
        <div style="background: #f3f4f6; padding: 20px 30px; font-size: 14px; color: #6b7280;">
          <p><strong>Ticket:</strong> #${data.ticketNumber} - ${data.subject}</p>
          <p><strong>Status:</strong> ${data.status}</p>
        </div>
      </div>
    `;
  }
}
