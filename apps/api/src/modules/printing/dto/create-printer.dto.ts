import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsJSON,
  IsIP,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import {
  PrinterType,
  PrinterPurpose,
  PrinterStatus,
  PrintJobType,
} from "@prisma/client";
import { PartialType } from "@nestjs/mapped-types";

export class CreatePrinterDto {
  @IsString()
  name: string;

  @IsEnum(PrinterType)
  type: PrinterType;

  @IsEnum(PrinterPurpose)
  purpose: PrinterPurpose;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  @Type(() => Number)
  port?: number;

  @IsOptional()
  @IsString()
  usbVendorId?: string;

  @IsOptional()
  @IsString()
  usbProductId?: string;

  @IsOptional()
  @IsString()
  macAddress?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  paperWidth?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  charactersPerLine?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdatePrinterDto extends PartialType(CreatePrinterDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreatePrintJobDto {
  @IsEnum(PrintJobType)
  type: PrintJobType;

  @IsString()
  content: string;

  @IsOptional()
  data?: any;

  @IsOptional()
  @IsString()
  printerId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  priority?: number;
}
