import { IsNumber, IsString, IsOptional, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class OccupyTableDto {
  @ApiProperty({ example: 4, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  partySize: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serverId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reservationId?: string;

  @ApiPropertyOptional({ description: "Estimated duration in minutes" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(15)
  @Max(480)
  estimatedDuration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
