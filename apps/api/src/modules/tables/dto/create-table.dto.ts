import {
    IsString,
    IsNumber,
    IsOptional,
    IsBoolean,
    IsEnum,
    Min,
    Max,
    Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export enum TableShape {
    RECTANGLE = 'rectangle',
    SQUARE = 'square',
    CIRCLE = 'circle',
    OVAL = 'oval',
}

export class CreateTableDto {
    @ApiProperty({ example: 'T1' })
    @IsString()
    @Length(1, 10)
    @Transform(({ value }) => value?.trim().toUpperCase())
    number: string;

    @ApiProperty({ example: 2, minimum: 1 })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(50)
    minCapacity: number;

    @ApiProperty({ example: 4, minimum: 1 })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(50)
    maxCapacity: number;

    @ApiPropertyOptional({ enum: TableShape })
    @IsOptional()
    @IsEnum(TableShape)
    shape?: TableShape;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    positionX?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    positionY?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(40)
    @Max(300)
    width?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(40)
    @Max(300)
    height?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(360)
    rotation?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    floorPlanId?: string;

    @ApiPropertyOptional({ example: 'Patio' })
    @IsOptional()
    @IsString()
    @Length(0, 50)
    section?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isSmokingAllowed?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isOutdoor?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    hasWindowView?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isAccessible?: boolean;
}
