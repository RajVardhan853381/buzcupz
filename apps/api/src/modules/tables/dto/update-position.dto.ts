import { IsNumber, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TablePositionDto {
    @ApiProperty()
    @IsString()
    tableId: string;

    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    positionX: number;

    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    positionY: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    width?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    height?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    rotation?: number;
}

export class BulkUpdatePositionsDto {
    @ApiProperty({ type: [TablePositionDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TablePositionDto)
    positions: TablePositionDto[];
}
