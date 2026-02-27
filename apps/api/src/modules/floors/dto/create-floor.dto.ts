import { IsString, IsOptional, IsNumber, Min, Max, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFloorDto {
    @ApiProperty({ example: 'Main Floor' })
    @IsString()
    @Length(2, 50)
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 500)
    description?: string;

    @ApiPropertyOptional({ default: 1200 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(400)
    @Max(3000)
    width?: number;

    @ApiPropertyOptional({ default: 800 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(300)
    @Max(2000)
    height?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    backgroundImage?: string;
}

export class UpdateFloorDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(2, 50)
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

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
    @IsString()
    backgroundImage?: string;
}
