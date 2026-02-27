import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuItemDto {
    @ApiProperty({ description: 'Name of the menu item' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'Description of the item' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'Price of the item' })
    @IsNumber()
    @Min(0)
    price: number;

    @ApiPropertyOptional({ description: 'Cost price for profit calculation' })
    @IsNumber()
    @Min(0)
    @IsOptional()
    costPrice?: number;

    @ApiPropertyOptional({ description: 'Image URL' })
    @IsString()
    @IsOptional()
    image?: string;

    @ApiProperty({ description: 'Category ID' })
    @IsString()
    categoryId: string;

    @ApiPropertyOptional({ description: 'Preparation time in minutes', default: 15 })
    @IsNumber()
    @IsOptional()
    preparationTime?: number;

    @ApiPropertyOptional({ description: 'Is vegetarian', default: false })
    @IsBoolean()
    @IsOptional()
    isVegetarian?: boolean;

    @ApiPropertyOptional({ description: 'Is vegan', default: false })
    @IsBoolean()
    @IsOptional()
    isVegan?: boolean;

    @ApiPropertyOptional({ description: 'Is gluten free', default: false })
    @IsBoolean()
    @IsOptional()
    isGlutenFree?: boolean;

    @ApiPropertyOptional({ description: 'Is spicy', default: false })
    @IsBoolean()
    @IsOptional()
    isSpicy?: boolean;

    @ApiPropertyOptional({ description: 'Spice level 0-5', default: 0 })
    @IsNumber()
    @IsOptional()
    spiceLevel?: number;

    @ApiPropertyOptional({ description: 'Is available for ordering', default: true })
    @IsBoolean()
    @IsOptional()
    isAvailable?: boolean;

    @ApiPropertyOptional({ description: 'Is featured item', default: false })
    @IsBoolean()
    @IsOptional()
    isFeatured?: boolean;
}
