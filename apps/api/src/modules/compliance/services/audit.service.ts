import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { Request } from 'express';

interface AuditLogParams {
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  restaurantId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  request?: Request;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          userId: params.userId,
          restaurantId: params.restaurantId,
          oldValues: params.oldValues,
          newValues: params.newValues,
          metadata: params.metadata,
          ipAddress: params.request?.ip || (params.request?.headers['x-forwarded-for'] as string),
          userAgent: params.request?.headers['user-agent'],
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`);
    }
  }

  async getAuditLogs(params: {
    restaurantId?: string;
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 50 } = params;

    const where: any = {};

    if (params.restaurantId) where.restaurantId = params.restaurantId;
    if (params.userId) where.userId = params.userId;
    if (params.action) where.action = { contains: params.action };
    if (params.resource) where.resource = params.resource;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Predefined audit actions
  static readonly ACTIONS = {
    // Auth
    USER_LOGIN: 'user.login',
    USER_LOGOUT: 'user.logout',
    USER_LOGIN_FAILED: 'user.login_failed',
    PASSWORD_CHANGED: 'user.password_changed',
    PASSWORD_RESET: 'user.password_reset',

    // Data
    DATA_EXPORT_REQUESTED: 'data.export_requested',
    DATA_EXPORT_COMPLETED: 'data.export_completed',
    DATA_DELETION_REQUESTED: 'data.deletion_requested',
    DATA_DELETION_COMPLETED: 'data.deletion_completed',

    // Orders
    ORDER_CREATED: 'order.created',
    ORDER_UPDATED: 'order.updated',
    ORDER_CANCELLED: 'order.cancelled',
    ORDER_REFUNDED: 'order.refunded',

    // Settings
    SETTINGS_UPDATED: 'settings.updated',
    SUBSCRIPTION_CHANGED: 'subscription.changed',
  };
}
