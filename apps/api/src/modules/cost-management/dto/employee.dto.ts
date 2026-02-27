
import {
    IsString,
    IsEnum,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsDateString,
    IsEmail,
    Min,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmployeeType, PaymentFrequency } from '@prisma/client';

class BenefitsDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    healthInsurance?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    retirement?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    bonus?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    other?: number;
}

export class CreateEmployeeDto {
    @IsString()
    @MaxLength(100)
    name: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    phone?: string;

    @IsString()
    @MaxLength(100)
    position: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    department?: string;

    @IsOptional()
    @IsEnum(EmployeeType)
    employeeType?: EmployeeType;

    @IsOptional()
    @IsEnum(PaymentFrequency)
    paymentFrequency?: PaymentFrequency;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    baseSalary: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    hourlyRate?: number;

    @IsDateString()
    hireDate: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => BenefitsDto)
    benefits?: BenefitsDto;
}

export class UpdateEmployeeDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    phone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    position?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    department?: string;

    @IsOptional()
    @IsEnum(EmployeeType)
    employeeType?: EmployeeType;

    @IsOptional()
    @IsEnum(PaymentFrequency)
    paymentFrequency?: PaymentFrequency;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    baseSalary?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    hourlyRate?: number;

    @IsOptional()
    @IsDateString()
    terminationDate?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @ValidateNested()
    @Type(() => BenefitsDto)
    benefits?: BenefitsDto;
}
