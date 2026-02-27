import {
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  Min,
  Max,
  Matches,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export enum VisitSource {
  WALK_IN = "walk-in",
  RESERVATION = "reservation",
  ONLINE_ORDER = "online-order",
}

export class RecordVisitDto {
  @ApiProperty({ minimum: 1, maximum: 50, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  partySize: number = 1;

  @ApiPropertyOptional({ enum: VisitSource })
  @IsOptional()
  @IsEnum(VisitSource)
  source?: VisitSource = VisitSource.WALK_IN;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
  time?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVisitDto {
  @ApiPropertyOptional()
  @IsOptional()
  hasOrdered?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  orderAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  exitTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  notes?: string;
}

export enum DateRangePreset {
  TODAY = "today",
  YESTERDAY = "yesterday",
  THIS_WEEK = "this_week",
  LAST_WEEK = "last_week",
  THIS_MONTH = "this_month",
  LAST_MONTH = "last_month",
  LAST_7_DAYS = "last_7_days",
  LAST_30_DAYS = "last_30_days",
  CUSTOM = "custom",
}

export class CounterFiltersDto {
  @ApiPropertyOptional({ enum: DateRangePreset })
  @IsOptional()
  @IsEnum(DateRangePreset)
  preset?: DateRangePreset = DateRangePreset.TODAY;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 50;
}
