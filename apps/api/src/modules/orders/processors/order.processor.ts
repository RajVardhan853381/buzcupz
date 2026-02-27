import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "../../../database/prisma.service";
import { OrdersGateway } from "../orders.gateway";

interface ProcessOrderJobData {
  orderId: string;
  restaurantId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
}

@Processor("orders")
export class OrderProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersGateway: OrdersGateway,
  ) {
    super();
  }

  async process(job: Job<ProcessOrderJobData>): Promise<any> {
    this.logger.log(`Processing job: ${job.name} (${job.id})`);

    switch (job.name) {
      case "process-order":
        return this.processNewOrder(job.data);
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async processNewOrder(data: ProcessOrderJobData) {
    const { orderId, restaurantId } = data;

    try {
      // Get the order
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              menuItem: {
                include: {
                  ingredients: true,
                },
              },
            },
          },
          table: true,
        },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      if (order.status !== "PENDING") {
        this.logger.log(`Order ${orderId} is not pending, skipping`);
        return;
      }

      // Deduct inventory (if ingredients are linked)
      for (const item of order.items) {
        if (item.menuItem.ingredients && item.menuItem.ingredients.length > 0) {
          for (const ingredient of item.menuItem.ingredients) {
            const quantityToDeduct =
              Number(ingredient.quantity) * item.quantity;

            // Update inventory
            await this.prisma.inventoryItem.update({
              where: { id: ingredient.inventoryItemId },
              data: {
                currentStock: {
                  decrement: quantityToDeduct,
                },
              },
            });

            // Record stock movement
            await this.prisma.stockMovement.create({
              data: {
                type: "USAGE",
                quantity: -quantityToDeduct,
                previousStock: 0, // Will be calculated
                newStock: 0,
                reference: `Order: ${order.orderNumber}`,
                inventoryItemId: ingredient.inventoryItemId,
              },
            });
          }
        }
      }

      // Update order status to CONFIRMED
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
        include: {
          items: {
            include: {
              menuItem: { select: { id: true, name: true } },
            },
          },
          table: true,
        },
      });

      // Record status change
      await this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: "CONFIRMED",
          notes: "Order auto-confirmed and sent to kitchen",
        },
      });

      // Broadcast update
      this.ordersGateway.broadcastOrderUpdate(restaurantId, updatedOrder);

      this.logger.log(`Order ${order.orderNumber} processed and confirmed`);

      return { success: true, orderId };
    } catch (error) {
      this.logger.error(`Error processing order ${orderId}:`, error);
      throw error;
    }
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}
