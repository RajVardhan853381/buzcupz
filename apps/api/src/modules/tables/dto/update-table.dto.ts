import { PartialType } from '@nestjs/swagger';
import { CreateTableDto } from './create-table.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum TableStatus {
    AVAILABLE = 'AVAILABLE',
    OCCUPIED = 'OCCUPIED',
    RESERVED = 'RESERVED',
    CLEANING = 'CLEANING',
    OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export class UpdateTableDto extends PartialType(CreateTableDto) {
    @ApiPropertyOptional({ enum: TableStatus })
    @IsOptional()
    @IsEnum(TableStatus)
    status?: TableStatus;
}
