import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsUUID,
  Min,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateLaborEntryDto {
  @IsUUID()
  employeeId: string;

  @IsDateString()
  payPeriodStart: string;

  @IsDateString()
  payPeriodEnd: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  regularHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  overtimeHours?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  basePay: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  overtimePay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bonus?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  tips?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  deductions?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  taxes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateLaborEntryDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  regularHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  overtimeHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  basePay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  overtimePay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bonus?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  tips?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  deductions?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  taxes?: number;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsDateString()
  paidDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
