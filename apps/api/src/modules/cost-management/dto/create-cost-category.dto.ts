
import {
    IsString,
    IsEnum,
    IsOptional,
    IsBoolean,
    MaxLength,
    Matches,
} from 'class-validator';
import { CostCategoryType, CostFrequency } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';

export class CreateCostCategoryDto {
    @IsString()
    @MaxLength(100)
    name: string;

    @IsEnum(CostCategoryType)
    type: CostCategoryType;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/)
    color?: string;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsBoolean()
    isRecurring?: boolean;

    @IsOptional()
    @IsEnum(CostFrequency)
    defaultFrequency?: CostFrequency;
}

export class UpdateCostCategoryDto extends PartialType(CreateCostCategoryDto) {
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
