import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
    @ApiProperty({ description: 'Name of the category' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'Description of the category' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Image URL' })
    @IsString()
    @IsOptional()
    image?: string;
}
