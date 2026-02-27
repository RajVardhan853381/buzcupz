import {
    IsString,
    IsNumber,
    IsOptional,
    IsEnum,
    IsDateString,
    Length,
    Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum AdjustmentType {
    ADD = 'ADD',
    REMOVE = 'REMOVE',
    SET = 'SET',
}

export enum AdjustmentReason {
    PURCHASE = 'PURCHASE',
    SALE = 'SALE',
    RETURN_FROM_CUSTOMER = 'RETURN_FROM_CUSTOMER',
    STOCK_COUNT = 'STOCK_COUNT',
    DAMAGE = 'DAMAGE',
    THEFT = 'THEFT',
    EXPIRY = 'EXPIRY',
    TRANSFER_IN = 'TRANSFER_IN',
    TRANSFER_OUT = 'TRANSFER_OUT',
    PRODUCTION = 'PRODUCTION',
    CORRECTION = 'CORRECTION',
    OTHER = 'OTHER',
}

export class StockAdjustmentDto {
    @ApiProperty({ enum: AdjustmentType })
    @IsEnum(AdjustmentType)
    type: AdjustmentType;

    @ApiProperty({ example: 25.5 })
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 4 })
    @Min(0)
    quantity: number;

    @ApiProperty({ enum: AdjustmentReason })
    @IsEnum(AdjustmentReason)
    reason: AdjustmentReason;

    @ApiPropertyOptional({ example: 12.50, description: 'Unit cost for this batch' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 4 })
    unitCost?: number;

    @ApiPropertyOptional({ example: 'PO-2024-001', description: 'Reference number' })
    @IsOptional()
    @IsString()
    @Length(0, 50)
    reference?: string;

    @ApiPropertyOptional({ example: 'Received from main supplier' })
    @IsOptional()
    @IsString()
    @Length(0, 500)
    notes?: string;
}
