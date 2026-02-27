import {
    IsOptional,
    IsEnum,
    IsNumber,
    IsDateString,
    IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DateRange } from './analytics-query.dto';

export enum SortByMetric {
    QUANTITY = 'QUANTITY',
    REVENUE = 'REVENUE',
    PROFIT = 'PROFIT',
}

export class BestSellersQueryDto {
    @ApiPropertyOptional({ enum: DateRange, default: DateRange.LAST_30_DAYS })
    @IsOptional()
    @IsEnum(DateRange)
    dateRange?: DateRange = DateRange.LAST_30_DAYS;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({ enum: SortByMetric, default: SortByMetric.REVENUE })
    @IsOptional()
    @IsEnum(SortByMetric)
    sortBy?: SortByMetric = SortByMetric.REVENUE;

    @ApiPropertyOptional({ default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 20;

    @ApiPropertyOptional({ description: 'Include comparison with previous period' })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    includeComparison?: boolean;
}
