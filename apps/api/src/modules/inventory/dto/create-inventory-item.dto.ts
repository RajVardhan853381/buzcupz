import {
    IsString,
    IsNumber,
    IsOptional,
    IsBoolean,
    IsPositive,
    Min,
    Max,
    Length,
    Matches,
    IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateInventoryItemDto {
    @ApiProperty({ example: 'Olive Oil Extra Virgin' })
    @IsString()
    @Length(2, 100)
    @Transform(({ value }) => value?.trim())
    name: string;

    @ApiPropertyOptional({ example: 'OIL-001', description: 'Unique SKU code' })
    @IsOptional()
    @IsString()
    @Length(2, 50)
    @Matches(/^[A-Za-z0-9-_]+$/, { message: 'SKU can only contain letters, numbers, hyphens, and underscores' })
    @Transform(({ value }) => value?.toUpperCase().trim())
    sku?: string;

    @ApiPropertyOptional({ example: 'Premium Italian extra virgin olive oil, cold pressed' })
    @IsOptional()
    @IsString()
    @Length(0, 500)
    description?: string;

    @ApiPropertyOptional({ example: 'Oils & Fats' })
    @IsOptional()
    @IsString()
    @Length(0, 50)
    category?: string;

    @ApiProperty({ example: 'liters', description: 'Unit of measurement' })
    @IsString()
    @Length(1, 20)
    unit: string;

    @ApiProperty({ example: 15.99, description: 'Cost per unit' })
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 4 })
    @IsPositive()
    costPerUnit: number;

    @ApiPropertyOptional({ example: 50, description: 'Initial stock quantity' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 4 })
    @Min(0)
    currentStock?: number;

    @ApiProperty({ example: 10, description: 'Minimum stock level before alert' })
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 4 })
    @Min(0)
    minimumStock: number;

    @ApiPropertyOptional({ example: 15, description: 'Stock level to trigger reorder' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 4 })
    @Min(0)
    reorderPoint?: number;

    @ApiPropertyOptional({ example: 50, description: 'Quantity to order when reordering' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 4 })
    @Min(0)
    reorderQuantity?: number;

    @ApiPropertyOptional({ example: 'Dry Storage - Shelf A3' })
    @IsOptional()
    @IsString()
    @Length(0, 100)
    storageLocation?: string;

    @ApiPropertyOptional({ description: 'Supplier ID' })
    @IsOptional()
    @IsString()
    supplierId?: string;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @IsBoolean()
    isPerishable?: boolean;

    @ApiPropertyOptional({ example: 365, description: 'Shelf life in days for perishables' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(3650)
    shelfLifeDays?: number;

    @ApiPropertyOptional({ description: 'Expiry date for perishable items' })
    @IsOptional()
    @IsDateString()
    expiryDate?: string;
}
