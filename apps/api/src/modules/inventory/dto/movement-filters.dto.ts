import {
    IsOptional,
    IsString,
    IsEnum,
    IsDateString,
    IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MovementFiltersDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    itemId?: string;

    @ApiPropertyOptional({ enum: ['PURCHASE', 'USAGE', 'WASTAGE', 'ADJUSTMENT', 'RETURN', 'TRANSFER'] })
    @IsOptional()
    @IsString()
    type?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    createdById?: string;

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
