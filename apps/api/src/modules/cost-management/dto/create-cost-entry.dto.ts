import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsUUID,
  IsArray,
  Min,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";
import { CostStatus, CostFrequency } from "@prisma/client";
import { PartialType } from "@nestjs/mapped-types";

export class CreateCostEntryDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  vendor?: string;

  @IsOptional()
  @IsEnum(CostStatus)
  status?: CostStatus;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsEnum(CostFrequency)
  frequency?: CostFrequency;

  @IsOptional()
  @IsDateString()
  recurringStartDate?: string;

  @IsOptional()
  @IsDateString()
  recurringEndDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class UpdateCostEntryDto extends PartialType(CreateCostEntryDto) {}
