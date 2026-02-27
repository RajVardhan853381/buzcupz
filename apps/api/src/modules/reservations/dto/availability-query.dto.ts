import { IsString, IsNumber, IsDateString, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class AvailabilityQueryDto {
  @ApiProperty()
  @IsString()
  restaurantId: string;

  @ApiProperty({ example: "2024-12-25" })
  @IsDateString()
  date: string;

  @ApiProperty({ minimum: 1, maximum: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  partySize: number;
}
