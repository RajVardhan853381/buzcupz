import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import {
  CreatePrinterDto,
  UpdatePrinterDto,
  CreatePrintJobDto,
} from "./dto/create-printer.dto";
import {
  PrintJobStatus,
  PrinterStatus,
  PrinterType,
  PrintJobType,
} from "@prisma/client";
import { ReceiptTemplateService } from "./receipt-template.service";

// Mocking library import if strict mode complains, but in real app:
// import ThermalPrinter from 'node-thermal-printer';
// const ThermalPrinter = require("node-thermal-printer").printer;
// const PrinterTypes = require("node-thermal-printer").types;

@Injectable()
export class PrintingService {
  private readonly logger = new Logger(PrintingService.name);

  constructor(
    private prisma: PrismaService,
    private templateService: ReceiptTemplateService,
  ) {}

  // ==================== PRINTER MANAGEMENT ====================

  async createPrinter(restaurantId: string, dto: CreatePrinterDto) {
    return this.prisma.printer.create({
      data: {
        ...dto,
        restaurantId,
      },
    });
  }

  async findAllPrinters(restaurantId: string) {
    return this.prisma.printer.findMany({
      where: { restaurantId },
      orderBy: { name: "asc" },
    });
  }

  async findPrinterById(restaurantId: string, id: string) {
    const printer = await this.prisma.printer.findUnique({ where: { id } });
    if (!printer || printer.restaurantId !== restaurantId) {
      throw new NotFoundException("Printer not found");
    }
    return printer;
  }

  async updatePrinter(restaurantId: string, id: string, dto: UpdatePrinterDto) {
    await this.findPrinterById(restaurantId, id);
    return this.prisma.printer.update({
      where: { id },
      data: dto,
    });
  }

  async deletePrinter(restaurantId: string, id: string) {
    await this.findPrinterById(restaurantId, id);
    return this.prisma.printer.delete({ where: { id } });
  }

  // ==================== PRINT JOBS ====================

  async createPrintJob(restaurantId: string, dto: CreatePrintJobDto) {
    // If printerId not provided, find default for purpose?
    // For now, require printerId or auto-assign logic (omitted for brevity)

    const job = await this.prisma.printJob.create({
      data: {
        restaurantId,
        type: dto.type,
        content: dto.content, // Raw content or JSON
        data: dto.data, // Associated data (orderId etc)
        status: PrintJobStatus.PENDING,
        printerId: dto.printerId,
        priority: dto.priority || 1,
      },
    });

    // Attempt to process immediately (async)
    this.processPrintJob(job.id).catch((err) =>
      this.logger.error(`Error processing print job ${job.id}`, err.stack),
    );

    return job;
  }

  async printOrder(restaurantId: string, orderId: string, printerId?: string) {
    // Fetch order with all details
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: true,
        table: true,
        items: { include: { modifiers: true } },
      },
    });

    if (!order) throw new NotFoundException("Order not found");

    // Generate formatted content
    const content = this.templateService.formatCustomerReceipt(order as any);

    // Identify valid printer
    let targetPrinterId = printerId;
    if (!targetPrinterId) {
      const defaultPrinter = await this.prisma.printer.findFirst({
        where: { restaurantId, isDefault: true, isActive: true },
      });
      targetPrinterId = defaultPrinter?.id;
    }

    if (!targetPrinterId)
      throw new NotFoundException("No active printer found");

    return this.createPrintJob(restaurantId, {
      type: PrintJobType.CUSTOMER_RECEIPT,
      content,
      printerId: targetPrinterId,
      data: { orderId },
    });
  }

  // ==================== EXECUTION LOGIC ====================

  async processPrintJob(jobId: string) {
    const job = await this.prisma.printJob.findUnique({
      where: { id: jobId },
      include: { printer: true },
    });

    if (!job || !job.printer) return;

    this.logger.log(
      `Processing print job ${job.id} for printer ${job.printer.name}`,
    );
    await this.prisma.printJob.update({
      where: { id: jobId },
      data: { status: PrintJobStatus.PRINTING },
    });

    try {
      if (job.printer.type === PrinterType.NETWORK) {
        // await this.printToNetworkPrinter(job.printer, job.content);
        this.logger.log(
          `[MOCK] Printing to NETWORK printer ${job.printer.ipAddress}`,
        );
        // Simulate network delay
        await new Promise((r) => setTimeout(r, 1000));
      } else {
        this.logger.log(`[MOCK] Printing to ${job.printer.type} printer`);
      }

      await this.prisma.printJob.update({
        where: { id: jobId },
        data: { status: PrintJobStatus.COMPLETED, printedAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Print failed for job ${job.id}`, error);
      await this.prisma.printJob.update({
        where: { id: jobId },
        data: {
          status: PrintJobStatus.FAILED,
          errorMessage: error.message,
          retryCount: { increment: 1 },
        },
      });
    }
  }
}
