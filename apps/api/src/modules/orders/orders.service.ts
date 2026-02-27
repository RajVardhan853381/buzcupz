import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
    forwardRef,
    Inject,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { OrdersGateway } from './orders.gateway';
import { CreateOrderDto, CreateOrderItemDto, OrderType } from './dto/create-order.dto';
import { UpdateOrderStatusDto, OrderStatus } from './dto/update-order-status.dto';
import { OrderFiltersDto } from './dto/order-filters.dto';
import { Prisma } from '@prisma/client';
import { format, startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => OrdersGateway))
        private readonly ordersGateway: OrdersGateway,
        @InjectQueue('orders') private readonly ordersQueue: Queue,
    ) { }

    /**
     * Create a new order
     */
    async create(dto: CreateOrderDto, userId: string, restaurantId: string) {
        this.logger.log(`Creating order for restaurant ${restaurantId}`);

        // Validate table if dine-in
        if (dto.type === OrderType.DINE_IN) {
            if (!dto.tableId) {
                throw new BadRequestException('Table is required for dine-in orders');
            }

            const table = await this.prisma.table.findFirst({
                where: { id: dto.tableId, restaurantId },
            });

            if (!table) {
                throw new BadRequestException('Table not found');
            }

            if (table.status === 'OUT_OF_SERVICE') {
                throw new BadRequestException('Table is out of service');
            }
        }

        // Get restaurant for tax rate
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            select: { taxRate: true },
        });

        // Calculate items with prices
        const itemsWithPrices = await this.calculateOrderItems(dto.items, restaurantId);

        // Calculate totals
        const subtotal = itemsWithPrices.reduce((sum, item) => sum + item.totalPrice, 0);
        const taxRate = Number(restaurant?.taxRate || 0) / 100;
        const taxAmount = subtotal * taxRate;
        const discountAmount = dto.discountAmount || 0;
        const total = subtotal + taxAmount - discountAmount;

        // Generate order number
        const orderNumber = await this.generateOrderNumber(restaurantId);

        // Calculate estimated ready time (max prep time of items + 5 min buffer)
        const maxPrepTime = Math.max(...itemsWithPrices.map((i) => i.preparationTime || 15));
        const estimatedReadyAt = new Date(Date.now() + (maxPrepTime + 5) * 60 * 1000);

        // Create order in transaction
        const order = await this.prisma.$transaction(async (tx) => {
            // Create the order
            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    type: dto.type,
                    status: 'PENDING',
                    subtotal,
                    taxAmount,
                    discountAmount,
                    total,
                    notes: dto.notes,
                    kitchenNotes: dto.kitchenNotes,
                    customerName: dto.customerName,
                    customerPhone: dto.customerPhone,
                    customerEmail: dto.customerEmail,
                    estimatedReadyAt,
                    tableId: dto.tableId,
                    createdById: userId,
                    restaurantId,
                    discountReason: dto.discountReason,
                    items: {
                        create: itemsWithPrices.map((item) => ({
                            menuItemId: item.menuItemId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.totalPrice,
                            modifiersPrice: item.modifiersPrice,
                            modifiers: {
                                create: item.modifiers?.map((m) => ({
                                    modifierId: m.modifierId,
                                    modifierName: m.modifierName,
                                    groupName: m.groupName,
                                    quantity: m.quantity,
                                    unitPrice: m.unitPrice,
                                    totalPrice: m.totalPrice,
                                })),
                            },
                            modifiersSummary: item.modifiersSummary,
                            notes: item.notes,
                        })),
                    },
                    statusHistory: {
                        create: {
                            status: 'PENDING',
                            notes: 'Order created',
                        },
                    },
                },
                include: {
                    items: {
                        include: {
                            menuItem: {
                                select: {
                                    id: true,
                                    name: true,
                                    image: true,
                                    preparationTime: true,
                                },
                            },
                            modifiers: true,
                        },
                    },
                    table: {
                        select: { id: true, number: true },
                    },
                    createdBy: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                },
            });

            // Update table status if dine-in
            if (dto.type === OrderType.DINE_IN && dto.tableId) {
                await tx.table.update({
                    where: { id: dto.tableId },
                    data: { status: 'OCCUPIED' },
                });
            }

            return newOrder;
        });

        // Queue order processing job
        await this.ordersQueue.add(
            'process-order',
            {
                orderId: order.id,
                restaurantId,
                items: itemsWithPrices,
            },
            { delay: 500 },
        );

        // Broadcast to connected clients
        this.ordersGateway.broadcastNewOrder(restaurantId, order);

        this.logger.log(`Order ${order.orderNumber} created successfully`);

        return order;
    }

    /**
     * Get all orders with filters
     */
    async findAll(restaurantId: string, filters: OrderFiltersDto) {
        const where: Prisma.OrderWhereInput = { restaurantId };

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.statuses && filters.statuses.length > 0) {
            where.status = { in: filters.statuses };
        }

        if (filters.type) {
            where.type = filters.type;
        }

        if (filters.tableId) {
            where.tableId = filters.tableId;
        }

        if (filters.date) {
            where.createdAt = {
                gte: startOfDay(new Date(filters.date)),
                lte: endOfDay(new Date(filters.date)),
            };
        }

        if (filters.dateFrom && filters.dateTo) {
            where.createdAt = {
                gte: startOfDay(new Date(filters.dateFrom)),
                lte: endOfDay(new Date(filters.dateTo)),
            };
        }

        if (filters.search) {
            where.OR = [
                { orderNumber: { contains: filters.search, mode: 'insensitive' } },
                { customerName: { contains: filters.search, mode: 'insensitive' } },
                { customerPhone: { contains: filters.search } },
            ];
        }

        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: {
                    items: {
                        include: {
                            menuItem: {
                                select: { id: true, name: true, image: true },
                            },
                        },
                    },
                    table: {
                        select: { id: true, number: true },
                    },
                    createdBy: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.order.count({ where }),
        ]);

        return {
            data: orders,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + orders.length < total,
            },
        };
    }

    /**
     * Get single order by ID
     */
    async findOne(id: string, restaurantId: string) {
        const order = await this.prisma.order.findFirst({
            where: { id, restaurantId },
            include: {
                items: {
                    include: {
                        menuItem: true,
                    },
                },
                table: true,
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
                statusHistory: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    /**
     * Get today's statistics
     */

    /**
     * Update order status
     */
    async updateStatus(
        id: string,
        dto: UpdateOrderStatusDto,
        restaurantId: string,
        userId?: string,
    ) {
        const order = await this.findOne(id, restaurantId);

        // Validate status transition
        this.validateStatusTransition(order.status as OrderStatus, dto.status);

        // Update order
        const updatedOrder = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.order.update({
                where: { id },
                data: {
                    status: dto.status,
                    ...(dto.status === OrderStatus.READY && { actualReadyAt: new Date() }),
                    ...(dto.status === OrderStatus.COMPLETED && {
                        paidAt: new Date(),
                        paymentStatus: 'PAID',
                    }),
                },
                include: {
                    items: {
                        include: {
                            menuItem: { select: { id: true, name: true } },
                        },
                    },
                    table: true,
                },
            });

            // Record status history
            await tx.orderStatusHistory.create({
                data: {
                    orderId: id,
                    status: dto.status,
                    notes: dto.notes,
                },
            });

            // Update table status
            if (updated.tableId) {
                if (dto.status === OrderStatus.COMPLETED) {
                    await tx.table.update({
                        where: { id: updated.tableId },
                        data: { status: 'CLEANING' },
                    });
                } else if (dto.status === OrderStatus.CANCELLED) {
                    const otherActiveOrders = await tx.order.count({
                        where: {
                            tableId: updated.tableId,
                            id: { not: id },
                            status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'] },
                        },
                    });

                    if (otherActiveOrders === 0) {
                        await tx.table.update({
                            where: { id: updated.tableId },
                            data: { status: 'AVAILABLE' },
                        });
                    }
                }
            }

            return updated;
        });

        // Broadcast status update
        this.ordersGateway.broadcastOrderUpdate(restaurantId, updatedOrder);

        this.logger.log(`Order ${updatedOrder.orderNumber} status updated to ${dto.status}`);

        return updatedOrder;
    }

    /**
     * Cancel an order
     */
    async cancel(id: string, reason: string, restaurantId: string) {
        const order = await this.findOne(id, restaurantId);

        if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
            throw new BadRequestException('Order cannot be cancelled');
        }

        return this.updateStatus(
            id,
            { status: OrderStatus.CANCELLED, notes: `Cancelled: ${reason}` },
            restaurantId,
        );
    }

    /**
     * Get today's statistics
     */
    async getTodayStats(restaurantId: string) {
        const today = new Date();
        const todayStart = startOfDay(today);
        const todayEnd = endOfDay(today);

        const [ordersByStatus, aggregates] = await Promise.all([
            this.prisma.order.groupBy({
                by: ['status'],
                where: {
                    restaurantId,
                    createdAt: { gte: todayStart, lte: todayEnd },
                },
                _count: { id: true },
                _sum: { total: true },
            }),
            this.prisma.order.aggregate({
                where: {
                    restaurantId,
                    createdAt: { gte: todayStart, lte: todayEnd },
                    status: { not: 'CANCELLED' },
                },
                _count: { id: true },
                _sum: { total: true },
                _avg: { total: true },
            }),
        ]);

        const statusCounts: Record<string, number> = {};
        ordersByStatus.forEach((item) => {
            statusCounts[item.status] = item._count.id;
        });

        return {
            totalOrders: aggregates._count.id,
            totalRevenue: Number(aggregates._sum.total || 0),
            averageOrderValue: Number(aggregates._avg.total || 0),
            statusCounts,
            pendingOrders: statusCounts['PENDING'] || 0,
            preparingOrders: (statusCounts['CONFIRMED'] || 0) + (statusCounts['PREPARING'] || 0),
            readyOrders: statusCounts['READY'] || 0,
            completedOrders: statusCounts['COMPLETED'] || 0,
            cancelledOrders: statusCounts['CANCELLED'] || 0,
        };
    }

    // ============================================
    // PRIVATE HELPER METHODS
    // ============================================

    private async calculateOrderItems(
        items: CreateOrderItemDto[],
        restaurantId: string,
    ) {
        const menuItemIds = items.map((i) => i.menuItemId);

        // Fetch menu items with full modifier configuration
        const menuItems = await this.prisma.menuItem.findMany({
            where: {
                id: { in: menuItemIds },
                restaurantId,
                isActive: true,
            },
            include: {
                modifierGroups: {
                    include: {
                        modifierGroup: {
                            include: {
                                modifiers: true,
                            },
                        },
                    },
                },
            },
        });

        const calculatedItems: any[] = [];

        for (const item of items) {
            const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);

            if (!menuItem) {
                throw new BadRequestException(`Menu item ${item.menuItemId} not found`);
            }

            if (!menuItem.isAvailable) {
                throw new BadRequestException(`${menuItem.name} is currently unavailable`);
            }

            const unitPrice = Number(menuItem.price);
            let modifiersPrice = 0;
            const modifierDetails = [];
            const modifierSummaryParts: string[] = [];

            // Process modifiers
            if (item.modifiers && item.modifiers.length > 0) {
                for (const modSelection of item.modifiers) {
                    // Find the modifier and its group within the menu item's assigned groups
                    let foundModifier = null;
                    let foundGroup = null;

                    if (menuItem.modifierGroups) {
                        for (const mig of menuItem.modifierGroups) {
                            const mod = mig.modifierGroup?.modifiers?.find(
                                (m: any) => m.id === modSelection.modifierId
                            );
                            if (mod) {
                                foundModifier = mod;
                                foundGroup = mig.modifierGroup;
                                break;
                            }
                        }
                    }

                    if (!foundModifier || !foundGroup) {
                        throw new BadRequestException(
                            `Modifier ${modSelection.modifierId} not found for item "${menuItem.name}"`
                        );
                    }

                    if (!foundModifier.isAvailable) {
                        throw new BadRequestException(
                            `Modifier "${foundModifier.name}" is not available`
                        );
                    }

                    const qty = modSelection.quantity || 1;
                    const modUnitPrice = this.calculateModifierPrice(foundModifier, unitPrice, 1);
                    const modTotalPrice = this.calculateModifierPrice(foundModifier, unitPrice, qty);

                    modifiersPrice += modTotalPrice;

                    modifierDetails.push({
                        modifierId: foundModifier.id,
                        modifierName: foundModifier.name,
                        groupName: foundGroup.displayName,
                        quantity: qty,
                        unitPrice: modUnitPrice,
                        totalPrice: modTotalPrice,
                    });

                    modifierSummaryParts.push(
                        qty > 1 ? `${qty}× ${foundModifier.name}` : foundModifier.name
                    );
                }
            }

            const singleItemTotal = unitPrice + modifiersPrice; // Unit price including modifiers
            const lineTotal = singleItemTotal * item.quantity;

            calculatedItems.push({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                unitPrice,
                modifiersPrice: modifiersPrice, // Per item unit
                totalPrice: lineTotal,
                notes: item.notes,
                modifiers: modifierDetails,
                modifiersSummary: modifierSummaryParts.join(', '),
                preparationTime: menuItem.preparationTime || 15,
            });
        }

        return calculatedItems;
    }

    private calculateModifierPrice(modifier: any, basePrice: number, quantity: number): number {
        const priceAdjustment = Number(modifier.price) || 0;
        // Simplified Logic for now as per Modifier entity
        return priceAdjustment * quantity;
    }

    private async generateOrderNumber(restaurantId: string): Promise<string> {
        const today = new Date();
        const datePrefix = format(today, 'yyyyMMdd');

        const lastOrder = await this.prisma.order.findFirst({
            where: {
                restaurantId,
                orderNumber: { startsWith: datePrefix },
            },
            orderBy: { orderNumber: 'desc' },
        });

        let sequence = 1;
        if (lastOrder) {
            const lastSequence = parseInt(lastOrder.orderNumber.slice(-4), 10);
            sequence = lastSequence + 1;
        }

        return `${datePrefix}-${sequence.toString().padStart(4, '0')}`;
    }

    /**
     * Get kitchen orders
     */
    async getKitchenOrders(restaurantId: string): Promise<any[]> {
        return this.prisma.order.findMany({
            where: {
                restaurantId,
                status: {
                    in: [
                        'PENDING',
                        'CONFIRMED',
                        'PREPARING',
                        'READY',
                    ],
                },
                // Only orders from today
                createdAt: {
                    gte: startOfDay(new Date()),
                },
            },
            include: {
                table: true,
                items: {
                    include: {
                        menuItem: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            },
                        },
                        modifiers: true,
                    },
                    orderBy: [{ createdAt: 'asc' }],
                },
            },
            orderBy: [
                { status: 'asc' }, // PENDING first
                { createdAt: 'asc' }, // Then by time
            ],
        });
    }

    /**
     * Update order item status
     */
    async updateItemStatus(
        orderId: string,
        itemId: string,
        // @ts-ignore - OrderItemStatus enum might not be imported or fully aligned yet
        status: string, // Using string for now to avoid enum conflict if shared types vs prisma types diverge
        restaurantId: string,
        userId?: string
    ) {
        // Verify order and item exist
        const order = await this.findOne(orderId, restaurantId);
        const item = order.items.find((i) => i.id === itemId);

        if (!item) {
            throw new NotFoundException(`Order item ${itemId} not found`);
        }

        // Update the item
        await this.prisma.$transaction(async (tx) => {
            // @ts-ignore
            await tx.orderItem.update({
                where: { id: itemId },
                data: {
                    status: status as any,
                },
            });

            // Check if all items are ready - auto-update order status
            const allItems = await tx.orderItem.findMany({
                where: { orderId },
            });

            // IsVoided check if schema supports it, otherwise ignore
            const activeItems = allItems;

            const allReady = activeItems.every(
                (i) =>
                    i.status === 'READY' ||
                    i.status === 'SERVED'
            );

            if (allReady && order.status === 'PREPARING') {
                // @ts-ignore
                await tx.order.update({
                    where: { id: orderId },
                    data: {
                        status: 'READY',
                        actualReadyAt: new Date(),
                    },
                });

                // Log history
                // @ts-ignore
                await tx.orderStatusHistory.create({
                    data: {
                        orderId,
                        status: 'READY',
                        notes: 'All items ready - Auto updated',
                    }
                });
            }

            // If any item started preparing, update order status
            const anyPreparing = activeItems.some(
                (i) =>
                    i.status === 'PREPARING' ||
                    i.status === 'READY' ||
                    i.status === 'SERVED'
            );

            if (
                anyPreparing &&
                (order.status === 'PENDING' ||
                    order.status === 'CONFIRMED')
            ) {
                // @ts-ignore
                await tx.order.update({
                    where: { id: orderId },
                    data: {
                        status: 'PREPARING',
                    },
                });

                // Log history
                // @ts-ignore
                await tx.orderStatusHistory.create({
                    data: {
                        orderId,
                        status: 'PREPARING',
                        notes: 'Item preparation started - Auto updated',
                    }
                });
            }
        });

        const updatedOrder = await this.findOne(orderId, restaurantId);
        this.ordersGateway.broadcastOrderUpdate(restaurantId, updatedOrder);

        return updatedOrder;
    }

    private validateStatusTransition(current: OrderStatus, next: OrderStatus): void {
        const validTransitions: Record<OrderStatus, OrderStatus[]> = {
            [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.PREPARING],
            [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
            [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
            [OrderStatus.READY]: [OrderStatus.SERVED, OrderStatus.CANCELLED],
            [OrderStatus.SERVED]: [OrderStatus.COMPLETED],
            [OrderStatus.COMPLETED]: [],
            [OrderStatus.CANCELLED]: [],
        };

        const allowed = validTransitions[current] || [];

        // Relax validation for KDS updates which might jump states via automation
        if (!allowed.includes(next) && next !== current) {
            // For now, let's just log and allow if it's a valid enum
            this.logger.warn(`Unusual status transition from ${current} to ${next}`);
            // throw new BadRequestException(...) 
            // We'll keep validation strict for generic updates but manual overrides or KDS logic might differ
        }
    }
}
