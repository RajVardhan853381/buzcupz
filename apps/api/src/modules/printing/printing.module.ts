import { Module } from "@nestjs/common";
import { PrintingService } from "./printing.service";
import { PrintingController } from "./printing.controller";
import { ReceiptTemplateService } from "./receipt-template.service";
import { PrismaService } from "@/database/prisma.service";

@Module({
  controllers: [PrintingController],
  providers: [PrintingService, ReceiptTemplateService, PrismaService],
  exports: [PrintingService],
})
export class PrintingModule {}
