import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { subDays, startOfDay } from 'date-fns';

export interface DashboardMetrics {
  overview: {
    totalRestaurants: number;
    activeRestaurants: number;
    totalOrders: number;
    totalRevenue: number;
    mrr: number;
  };
  growth: {
    newRestaurantsToday: number;
    newRestaurantsThisWeek: number;
    newRestaurantsThisMonth: number;
  };
  subscriptions: {
    trial: number;
    starter: number;
    professional: number;
    enterprise: number;
  };
}

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const today = startOfDay(now);
    const weekAgo = subDays(today, 7);
    const monthAgo = subDays(today, 30);

    // Parallel queries for performance
    const [
      totalRestaurants,
      activeRestaurants,
      totalOrders,
      totalRevenue,
      newRestaurantsToday,
      newRestaurantsThisWeek,
      newRestaurantsThisMonth,
      subscriptionCounts,
    ] = await Promise.all([
      // Total restaurants
      this.prisma.restaurant.count(),
      
      // Active restaurants (had activity in last 30 days)
      this.prisma.restaurant.count({
        where: {
          orders: {
            some: {
              createdAt: { gte: monthAgo },
            },
          },
        },
      }),
      
      // Total orders (all time)
      this.prisma.order.count(),
      
      // Total revenue (all time)
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'PAID' },
      }),
      
      // New restaurants today
      this.prisma.restaurant.count({
        where: { createdAt: { gte: today } },
      }),
      
      // New restaurants this week
      this.prisma.restaurant.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      
      // New restaurants this month
      this.prisma.restaurant.count({
        where: { createdAt: { gte: monthAgo } },
      }),
      
      // Subscription counts by plan
      this.prisma.subscription.groupBy({
        by: ['plan', 'status'],
        _count: true,
      }),
    ]);

    // Calculate MRR
    const mrr = await this.calculateMRR();

    // Process subscription counts
    const subscriptions = {
      trial: 0,
      starter: 0,
      professional: 0,
      enterprise: 0,
    };

    for (const sub of subscriptionCounts) {
      if (sub.status !== 'CANCELED') {
        const planKey = sub.plan.toLowerCase() as keyof typeof subscriptions;
        if (planKey in subscriptions) {
          subscriptions[planKey] += sub._count;
        }
      }
    }

    return {
      overview: {
        totalRestaurants,
        activeRestaurants,
        totalOrders,
        totalRevenue: Number(totalRevenue._sum.totalAmount) || 0,
        mrr,
      },
      growth: {
        newRestaurantsToday,
        newRestaurantsThisWeek,
        newRestaurantsThisMonth,
      },
      subscriptions,
    };
  }

  async getRestaurantsList(params: {
    search?: string;
    plan?: string;
    status?: 'active' | 'inactive' | 'trial';
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = params;

    const where: any = {};

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { subdomain: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.plan) {
      where.subscription = { plan: params.plan };
    }

    if (params.status) {
      if (params.status === 'active') {
        where.isActive = true;
        where.subscription = { status: 'ACTIVE' };
      } else if (params.status === 'inactive') {
        where.isActive = false;
      } else if (params.status === 'trial') {
        where.subscription = { status: 'TRIALING' };
      }
    }

    const [restaurants, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        include: {
          subscription: {
            select: {
              plan: true,
              status: true,
              currentPeriodEnd: true,
            },
          },
          _count: {
            select: {
              orders: true,
              users: true,
              menuItems: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return {
      data: restaurants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getRestaurantDetails(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        subscription: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
        _count: {
          select: {
            orders: true,
            menuItems: true,
            tables: true,
            reservations: true,
          },
        },
      },
    });

    if (!restaurant) {
      return null;
    }

    // Get recent orders
    const recentOrders = await this.prisma.order.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    });

    // Get revenue stats
    const thirtyDaysAgo = subDays(new Date(), 30);
    const revenueStats = await this.prisma.order.aggregate({
      where: {
        restaurantId,
        createdAt: { gte: thirtyDaysAgo },
        paymentStatus: 'PAID',
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    return {
      ...restaurant,
      recentOrders,
      last30Days: {
        revenue: Number(revenueStats._sum.totalAmount) || 0,
        orderCount: revenueStats._count,
      },
    };
  }

  async suspendRestaurant(restaurantId: string, reason: string, adminId: string) {
    await this.prisma.$transaction([
      this.prisma.restaurant.update({
        where: { id: restaurantId },
        data: { isActive: false },
      }),
      this.prisma.adminAuditLog.create({
        data: {
          adminId,
          action: 'restaurant.suspended',
          resource: 'Restaurant',
          resourceId: restaurantId,
          details: { reason },
        },
      }),
    ]);
  }

  async reactivateRestaurant(restaurantId: string, adminId: string) {
    await this.prisma.$transaction([
      this.prisma.restaurant.update({
        where: { id: restaurantId },
        data: { isActive: true },
      }),
      this.prisma.adminAuditLog.create({
        data: {
          adminId,
          action: 'restaurant.reactivated',
          resource: 'Restaurant',
          resourceId: restaurantId,
        },
      }),
    ]);
  }

  private async calculateMRR(): Promise<number> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: { plan: true },
    });

    const planPrices = {
      TRIAL: 0,
      STARTER: 29,
      PROFESSIONAL: 79,
      ENTERPRISE: 199,
    };

    return subscriptions.reduce((total, sub) => {
      return total + (planPrices[sub.plan] || 0);
    }, 0);
  }
}
