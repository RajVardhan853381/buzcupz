import { IsOptional, IsEnum, IsDateString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum DateRange {
  TODAY = "TODAY",
  YESTERDAY = "YESTERDAY",
  LAST_7_DAYS = "LAST_7_DAYS",
  LAST_30_DAYS = "LAST_30_DAYS",
  THIS_WEEK = "THIS_WEEK",
  LAST_WEEK = "LAST_WEEK",
  THIS_MONTH = "THIS_MONTH",
  LAST_MONTH = "LAST_MONTH",
  THIS_YEAR = "THIS_YEAR",
  CUSTOM = "CUSTOM",
}

export class AnalyticsQueryDto {
  @ApiProperty({ enum: DateRange, default: DateRange.LAST_7_DAYS })
  @IsEnum(DateRange)
  dateRange: DateRange = DateRange.LAST_7_DAYS;

  @ApiPropertyOptional({ description: "Start date for custom range" })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: "End date for custom range" })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
