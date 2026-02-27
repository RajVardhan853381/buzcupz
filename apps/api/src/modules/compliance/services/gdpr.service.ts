import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { DataRequestType, DataRequestStatus } from "@prisma/client";
import { NotificationsService } from "@/modules/notifications/notifications.service";
import { StorageService } from "@/modules/storage/storage.service";
import * as crypto from "crypto";
import * as archiver from "archiver";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly storage: StorageService,
  ) {}

  // ============ DATA EXPORT (Right to Portability) ============

  async requestDataExport(
    email: string,
    type: "user" | "customer",
  ): Promise<{ requestId: string }> {
    // Find the user/customer
    let userId: string | null = null;
    let customerId: string | null = null;

    if (type === "user") {
      const user = await this.prisma.user.findFirst({ where: { email } });
      if (!user) throw new NotFoundException("User not found");
      userId = user.id;
    } else {
      const customer = await this.prisma.guest.findFirst({ where: { email } });
      if (!customer) throw new NotFoundException("Customer not found");
      customerId = customer.id;
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create request
    const request = await this.prisma.dataExportRequest.create({
      data: {
        email,
        userId,
        customerId,
        type: DataRequestType.EXPORT,
        status: DataRequestStatus.PENDING,
        verificationToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Send verification email (using templates created)
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    await this.notifications.sendEmail({
      to: email,
      subject: "Verify Your Data Export Request - CAFEelevate",
      html: this.getVerificationEmailHtml({
        verifyUrl: `${appUrl}/data-request/verify?token=${verificationToken}`,
        expiresIn: "24 hours",
      }),
    });

    this.logger.log(`Data export requested for ${email}`);

    return { requestId: request.id };
  }

  async verifyDataRequest(token: string): Promise<void> {
    const request = await this.prisma.dataExportRequest.findUnique({
      where: { verificationToken: token },
    });

    if (!request) {
      throw new NotFoundException("Request not found");
    }

    if (request.verifiedAt) {
      throw new BadRequestException("Request already verified");
    }

    if (request.expiresAt && request.expiresAt < new Date()) {
      throw new BadRequestException("Request has expired");
    }

    await this.prisma.dataExportRequest.update({
      where: { id: request.id },
      data: {
        status: DataRequestStatus.VERIFIED,
        verifiedAt: new Date(),
      },
    });

    // Queue the export job
    await this.processDataExport(request.id);
  }

  async processDataExport(requestId: string): Promise<void> {
    const request = await this.prisma.dataExportRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.status !== DataRequestStatus.VERIFIED) {
      return;
    }

    await this.prisma.dataExportRequest.update({
      where: { id: requestId },
      data: { status: DataRequestStatus.PROCESSING, processedAt: new Date() },
    });

    try {
      let data: Record<string, any>;

      if (request.userId) {
        data = await this.collectUserData(request.userId);
      } else if (request.customerId) {
        data = await this.collectCustomerData(request.customerId);
      } else {
        throw new Error("No user or customer ID");
      }

      // Create ZIP archive
      const zipBuffer = await this.createDataArchive(data);

      // Upload to storage (S3 or local)
      const downloadUrl = await this.storage.uploadFile(
        `exports/${requestId}/data-export.zip`,
        zipBuffer,
        "application/zip",
        { expiresIn: 7 * 24 * 60 * 60 }, // 7 days
      );

      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: DataRequestStatus.COMPLETED,
          completedAt: new Date(),
          downloadUrl,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Send download link email
      await this.notifications.sendEmail({
        to: request.email,
        subject: "Your Data Export is Ready - CAFEelevate",
        html: this.getDownloadEmailHtml({
          downloadUrl,
          expiresIn: "7 days",
        }),
      });

      this.logger.log(`Data export completed for ${request.email}`);
    } catch (error) {
      this.logger.error(`Data export failed: ${error.message}`, error.stack);

      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: DataRequestStatus.FAILED,
          errorMessage: error.message,
        },
      });
    }
  }

  private async collectUserData(userId: string): Promise<Record<string, any>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        restaurant: {
          select: { name: true, subdomain: true },
        },
      },
    });

    // Collect all related data
    const orders = await this.prisma.order.findMany({
      where: { createdById: userId },
      include: { items: true },
      take: 1000,
    });

    return {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt,
        restaurant: user.restaurant,
      },
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.totalAmount,
        createdAt: o.createdAt,
        items: o.items,
      })),
    };
  }

  private async collectCustomerData(
    customerId: string,
  ): Promise<Record<string, any>> {
    const customer = await this.prisma.guest.findUnique({
      where: { id: customerId },
    });

    const reservations = await this.prisma.reservation.findMany({
      where: { guestId: customerId },
    });

    return {
      exportDate: new Date().toISOString(),
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        createdAt: customer.createdAt,
      },
      reservations,
    };
  }

  private async createDataArchive(data: Record<string, any>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const archive = archiver("zip", { zlib: { level: 9 } });

      archive.on("data", (chunk) => chunks.push(chunk));
      archive.on("end", () => resolve(Buffer.concat(chunks)));
      archive.on("error", reject);

      // Add JSON data
      archive.append(JSON.stringify(data, null, 2), { name: "data.json" });

      // Add README
      archive.append(this.getReadmeContent(), { name: "README.txt" });

      archive.finalize();
    });
  }

  private getReadmeContent(): string {
    return `
DATA EXPORT - CAFEelevate
========================

This archive contains all personal data we have stored about you.

Contents:
- data.json: All your data in JSON format

Data Categories Included:
- Profile Information
- Order History
- Reservations
- Activity Logs

If you have questions about this data, contact: privacy@cafeelevate.com

Export Date: ${new Date().toISOString()}
    `.trim();
  }

  // ============ DATA DELETION (Right to Erasure) ============

  async requestDataDeletion(
    email: string,
    type: "user" | "customer",
  ): Promise<{ requestId: string }> {
    const verificationToken = crypto.randomBytes(32).toString("hex");

    let userId: string | null = null;
    let customerId: string | null = null;

    if (type === "user") {
      const user = await this.prisma.user.findFirst({ where: { email } });
      if (!user) throw new NotFoundException("User not found");
      userId = user.id;
    } else {
      const customer = await this.prisma.guest.findFirst({ where: { email } });
      if (!customer) throw new NotFoundException("Customer not found");
      customerId = customer.id;
    }

    const request = await this.prisma.dataExportRequest.create({
      data: {
        email,
        userId,
        customerId,
        type: DataRequestType.DELETE,
        status: DataRequestStatus.PENDING,
        verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // await this.emailService.send({
    //   to: email,
    //   subject: 'Confirm Your Data Deletion Request',
    //   template: 'data-deletion-verify',
    //   templateData: {
    //     verifyUrl: `${process.env.APP_URL}/data-request/verify-deletion?token=${verificationToken}`,
    //     expiresIn: '24 hours',
    //     warning: 'This action cannot be undone.',
    //   },
    // });

    return { requestId: request.id };
  }

  async processDataDeletion(requestId: string): Promise<void> {
    const request = await this.prisma.dataExportRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.status !== DataRequestStatus.VERIFIED) {
      return;
    }

    await this.prisma.dataExportRequest.update({
      where: { id: requestId },
      data: { status: DataRequestStatus.PROCESSING, processedAt: new Date() },
    });

    try {
      if (request.userId) {
        await this.deleteUserData(request.userId);
      } else if (request.customerId) {
        await this.deleteCustomerData(request.customerId);
      }

      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: DataRequestStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // await this.emailService.send({
      //   to: request.email,
      //   subject: 'Your Data Has Been Deleted',
      //   template: 'data-deletion-complete',
      //   templateData: {
      //     deletedAt: new Date().toISOString(),
      //   },
      // });

      this.logger.log(`Data deletion completed for ${request.email}`);
    } catch (error) {
      this.logger.error(`Data deletion failed: ${error.message}`, error.stack);

      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: DataRequestStatus.FAILED,
          errorMessage: error.message,
        },
      });
    }
  }

  private async deleteUserData(userId: string): Promise<void> {
    // Anonymize user data instead of hard delete (for audit purposes)
    const anonymousEmail = `deleted-${userId}@anonymized.local`;

    await this.prisma.$transaction([
      // Anonymize user
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: anonymousEmail,
          firstName: "Deleted",
          lastName: "User",
          phone: null,
          passwordHash: "DELETED",
          isActive: false,
        },
      }),

      // Anonymize orders
      this.prisma.order.updateMany({
        where: { createdById: userId },
        data: { createdById: null },
      }),
    ]);
  }

  private async deleteCustomerData(customerId: string): Promise<void> {
    const anonymousEmail = `deleted-${customerId}@anonymized.local`;

    await this.prisma.$transaction([
      // Anonymize customer
      this.prisma.guest.update({
        where: { id: customerId },
        data: {
          email: anonymousEmail,
          firstName: "Deleted",
          lastName: "Customer",
          phone: null,
        },
      }),

      // Anonymize reservations
      this.prisma.reservation.updateMany({
        where: { guestId: customerId },
        data: {
          guestName: "Deleted Customer",
          guestEmail: anonymousEmail,
          guestPhone: null,
          specialRequests: null,
        },
      }),
    ]);
  }

  /**
   * Helper method to generate verification email HTML
   */
  private getVerificationEmailHtml(data: {
    verifyUrl: string;
    expiresIn: string;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">🔒 Data Export Request</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <p>Hello,</p>
          <p>You have requested an export of your personal data from <strong>CAFEelevate</strong>.</p>
          <p>To verify this request and start processing your data export, please click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Verify Data Export Request
            </a>
          </div>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px;">
            <strong>⏰ Time Sensitive:</strong> This verification link will expire in <strong>${data.expiresIn}</strong>.
          </div>
          <p><strong>Didn't request this?</strong> If you did not initiate this data export request, please ignore this email.</p>
        </div>
      </div>
    `;
  }

  /**
   * Helper method to generate download ready email HTML
   */
  private getDownloadEmailHtml(data: {
    downloadUrl: string;
    expiresIn: string;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">✅ Your Data is Ready!</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <p>Hello,</p>
          <p>Great news! Your data export from <strong>CAFEelevate</strong> has been successfully processed.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.downloadUrl}" style="display: inline-block; padding: 14px 28px; background: #10B981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              📥 Download Your Data
            </a>
          </div>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px;">
            <strong>⚠️ Important:</strong> This download link will expire in <strong>${data.expiresIn}</strong>.
          </div>
          <p><strong>Data Privacy:</strong> Your data export contains sensitive information. Please store it securely.</p>
        </div>
      </div>
    `;
  }
}
