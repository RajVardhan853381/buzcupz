import { IsString, IsOptional, Length, Matches, IsEmail, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateSupplierDto {
    @ApiProperty({ example: 'Fresh Farms Ltd.' })
    @IsString()
    @Length(2, 100)
    @Transform(({ value }) => value?.trim())
    name: string;

    @ApiPropertyOptional({ example: 'SUP-001' })
    @IsOptional()
    @IsString()
    @Length(2, 20)
    code?: string;

    @ApiPropertyOptional({ example: 'John Smith' })
    @IsOptional()
    @IsString()
    @Length(0, 100)
    contactName?: string;

    @ApiPropertyOptional({ example: 'orders@freshfarms.com' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ example: '+1-555-0123' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ example: '123 Farm Road, Agriculture City' })
    @IsOptional()
    @IsString()
    @Length(0, 300)
    address?: string;

    @ApiPropertyOptional({ example: 'Net 30' })
    @IsOptional()
    @IsString()
    paymentTerms?: string;

    @ApiPropertyOptional({ example: 'Reliable supplier for organic produce' })
    @IsOptional()
    @IsString()
    @Length(0, 500)
    notes?: string;
}
