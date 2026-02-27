import {
    IsString,
    IsNumber,
    IsOptional,
    IsEnum,
    IsDateString,
    Min,
    Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum WastageReason {
    EXPIRED = 'EXPIRED',
    DAMAGED = 'DAMAGED',
    OVERCOOKED = 'OVERCOOKED',
    DROPPED = 'DROPPED',
    OVERPRODUCTION = 'OVERPRODUCTION',
    CUSTOMER_RETURN = 'CUSTOMER_RETURN',
    OTHER = 'OTHER',
}

export class CreateWastageDto {
    @ApiProperty({ description: 'Inventory item ID' })
    @IsString()
    inventoryItemId: string;

    @ApiProperty({ example: 2.5 })
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 3 })
    @Min(0.001)
    quantity: number;

    @ApiProperty({ enum: WastageReason })
    @IsEnum(WastageReason)
    reason: WastageReason;

    @ApiPropertyOptional({ example: 'Found mold on tomatoes' })
    @IsOptional()
    @IsString()
    @Length(0, 500)
    description?: string;

    @ApiPropertyOptional({ description: 'When the waste occurred' })
    @IsOptional()
    @IsDateString()
    occurredAt?: string;

    @ApiPropertyOptional({ example: 'Kitchen' })
    @IsOptional()
    @IsString()
    station?: string;
}
