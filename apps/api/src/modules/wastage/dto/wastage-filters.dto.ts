import {
    IsOptional,
    IsString,
    IsEnum,
    IsDateString,
    IsNumber,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WastageReason } from './create-wastage.dto';

export class WastageFiltersDto {
    @ApiPropertyOptional({ enum: WastageReason })
    @IsOptional()
    @IsEnum(WastageReason)
    reason?: WastageReason;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    station?: string;

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
    search?: string;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @ApiPropertyOptional({ default: 25 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 25;
}
