import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsInt,
    Min,
    Max,
    IsEmail,
    IsEnum,
    IsBoolean,
    IsDateString,
    IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
    ReservationStatus,
    ReservationSource,
    CelebrationType,
    SeatingPreference,
} from '@prisma/client';

// ============================================
// CREATE RESERVATION
// ============================================

export class CreateReservationDto {
    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @IsNotEmpty()
    guestName: string;

    @ApiPropertyOptional({ example: 'john@example.com' })
    @IsOptional()
    @IsEmail()
    guestEmail?: string;

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsOptional()
    @IsString()
    guestPhone?: string;

    @ApiProperty({ example: 4, minimum: 1, maximum: 20 })
    @IsInt()
    @Min(1)
    @Max(20)
    partySize: number;

    @ApiProperty({ example: '2024-12-25' })
    @IsDateString()
    date: string;

    @ApiProperty({ example: '19:00', description: 'Start time in HH:mm format' })
    @IsString()
    @IsNotEmpty()
    startTime: string;

    @ApiPropertyOptional({ example: 90, description: 'Duration in minutes' })
    @IsOptional()
    @IsInt()
    @Min(30)
    @Max(300)
    duration?: number;

    @ApiPropertyOptional({ example: 'clh1234567890' })
    @IsOptional()
    @IsString()
    tableId?: string;

    @ApiPropertyOptional({ type: 'string' })
    @IsOptional()
    @IsEnum(ReservationSource)
    source?: string;

    @ApiPropertyOptional({ type: 'string' })
    @IsOptional()
    @IsString()
    celebrationType?: string;

    @ApiPropertyOptional({ example: "Wife's 30th birthday" })
    @IsOptional()
    @IsString()
    celebrationNote?: string;

    @ApiPropertyOptional({ example: 'Nut allergy, vegetarian' })
    @IsOptional()
    @IsString()
    dietaryNotes?: string;

    @ApiPropertyOptional({ type: 'string' })
    @IsOptional()
    @IsEnum(SeatingPreference)
    seatingPreference?: string;

    @ApiPropertyOptional({ example: 'Window seat preferred' })
    @IsOptional()
    @IsString()
    specialRequests?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isVIP?: boolean;

    @ApiPropertyOptional({ example: 'clh1234567890' })
    @IsOptional()
    @IsString()
    guestId?: string;
}

// ============================================
// UPDATE RESERVATION
// ============================================

export class UpdateReservationDto extends PartialType(CreateReservationDto) {
    @ApiPropertyOptional({ type: 'string' })
    @IsOptional()
    @IsEnum(ReservationStatus)
    status?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    internalNotes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    cancelReason?: string;
}

// ============================================
// RESCHEDULE RESERVATION
// ============================================

export class RescheduleReservationDto {
    @ApiProperty({ example: '2024-12-26' })
    @IsDateString()
    date: string;

    @ApiProperty({ example: '20:00' })
    @IsString()
    @IsNotEmpty()
    startTime: string;

    @ApiPropertyOptional({ example: 'clh1234567890' })
    @IsOptional()
    @IsString()
    tableId?: string;

    @ApiPropertyOptional({ example: 'Guest requested later time' })
    @IsOptional()
    @IsString()
    reason?: string;
}

// ============================================
// CHANGE TABLE
// ============================================

export class ChangeTableDto {
    @ApiProperty({ example: 'clh1234567890' })
    @IsString()
    @IsNotEmpty()
    tableId: string;

    @ApiPropertyOptional({ example: 'Moved to quieter section' })
    @IsOptional()
    @IsString()
    reason?: string;
}

// ============================================
// STATUS CHANGE
// ============================================

export class ChangeStatusDto {
    @ApiProperty({ type: 'string' })
    @IsEnum(ReservationStatus)
    status: string;

    @ApiPropertyOptional({ example: 'Guest called to cancel' })
    @IsOptional()
    @IsString()
    reason?: string;
}

// ============================================
// QUERY FILTERS
// ============================================

export class ReservationQueryDto {
    @ApiPropertyOptional({ example: '2024-12-25' })
    @IsOptional()
    @IsDateString()
    date?: string;

    @ApiPropertyOptional({ example: '2024-12-01' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ example: '2024-12-31' })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({ type: 'string', isArray: true })
    @IsOptional()
    @IsArray()
    @IsEnum(ReservationStatus, { each: true })
    @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
    status?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    tableId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ example: 'day', enum: ['day', 'week', 'month'] })
    @IsOptional()
    @IsString()
    view?: 'day' | 'week' | 'month';

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ default: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}

// ============================================
// AVAILABILITY CHECK
// ============================================

export class CheckAvailabilityDto {
    @ApiProperty({ example: '2024-12-25' })
    @IsDateString()
    date: string;

    @ApiProperty({ example: 4 })
    @IsInt()
    @Min(1)
    @Max(20)
    partySize: number;

    @ApiPropertyOptional({ example: '19:00' })
    @IsOptional()
    @IsString()
    preferredTime?: string;

    @ApiPropertyOptional({ example: 90 })
    @IsOptional()
    @IsInt()
    @Min(30)
    duration?: number;
}

// ============================================
// RESPONSE DTOS
// ============================================

export class TimeSlotDto {
    @ApiProperty({ example: '19:00' })
    time: string;

    @ApiProperty()
    available: boolean;

    @ApiProperty({ example: 3 })
    availableTables: number;

    @ApiProperty({ type: [String] })
    tableIds: string[];
}

export class AvailabilityResponseDto {
    @ApiProperty({ example: '2024-12-25' })
    date: string;

    @ApiProperty({ example: 4 })
    partySize: number;

    @ApiProperty({ type: [TimeSlotDto] })
    slots: TimeSlotDto[];
}

export class CalendarDayDto {
    @ApiProperty({ example: '2024-12-25' })
    date: string;

    @ApiProperty({ example: 15 })
    totalReservations: number;

    @ApiProperty({ example: 45 })
    totalGuests: number;

    @ApiProperty({ example: 8 })
    confirmedCount: number;

    @ApiProperty({ example: 3 })
    pendingCount: number;

    @ApiProperty({ example: 2 })
    waitlistCount: number;

    @ApiProperty()
    isPeakDay: boolean;
}

export class ReservationResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    guestName: string;

    @ApiProperty()
    guestEmail?: string;

    @ApiProperty()
    guestPhone?: string;

    @ApiProperty()
    partySize: number;

    @ApiProperty()
    date: Date;

    @ApiProperty()
    startTime: Date;

    @ApiProperty()
    endTime: Date;

    @ApiProperty()
    duration: number;

    @ApiProperty({ type: 'string' })
    status: string;

    @ApiProperty({ type: 'string' })
    source: string;

    @ApiProperty()
    isVIP: boolean;

    @ApiProperty()
    celebrationType?: string;

    @ApiProperty()
    dietaryNotes?: string;

    @ApiProperty()
    specialRequests?: string;

    @ApiProperty()
    confirmationCode?: string;

    @ApiProperty()
    table?: {
        id: string;
        name: string;
        section?: string;
        maxCapacity: number;
    };

    @ApiProperty()
    guest?: {
        id: string;
        firstName: string;
        lastName: string;
        totalVisits: number;
        isVIP: boolean;
    };

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
