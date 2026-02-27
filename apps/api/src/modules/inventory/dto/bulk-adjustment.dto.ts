import { Type } from 'class-transformer';
import { IsArray, ValidateNested, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StockAdjustmentDto } from './stock-adjustment.dto';

export class BulkAdjustmentItemDto extends StockAdjustmentDto {
    @ApiProperty()
    @IsString()
    itemId: string;
}

export class BulkAdjustmentDto {
    @ApiProperty({ type: [BulkAdjustmentItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkAdjustmentItemDto)
    adjustments: BulkAdjustmentItemDto[];
}
