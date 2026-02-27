import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { ReservationsService } from "./reservations.service";
import {
  CreateReservationDto,
  UpdateReservationDto,
  RescheduleReservationDto,
  ChangeTableDto,
  ChangeStatusDto,
  ReservationQueryDto,
  CheckAvailabilityDto,
  ReservationResponseDto,
  AvailabilityResponseDto,
  CalendarDayDto,
} from "./dto/reservation.dto";

@ApiTags("Reservations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("reservations")
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // ============================================
  // CRUD ENDPOINTS
  // ============================================

  @Post()
  @ApiOperation({ summary: "Create a new reservation" })
  @ApiResponse({ status: 201, type: ReservationResponseDto })
  async create(
    @Body() dto: CreateReservationDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.reservationsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: "Get all reservations with filters" })
  @ApiResponse({ status: 200, type: [ReservationResponseDto] })
  async findAll(@Query() query: ReservationQueryDto) {
    return this.reservationsService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a reservation by ID" })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  @ApiParam({ name: "id", description: "Reservation ID" })
  async findOne(@Param("id") id: string) {
    return this.reservationsService.findOne(id);
  }

  @Get("code/:code")
  @ApiOperation({ summary: "Get a reservation by confirmation code" })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  async findByCode(@Param("code") code: string) {
    return this.reservationsService.findByConfirmationCode(code);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a reservation" })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateReservationDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.reservationsService.update(id, dto, userId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a reservation" })
  async remove(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.reservationsService.remove(id, userId);
  }

  // ============================================
  // STATUS & ACTIONS
  // ============================================

  @Patch(":id/status")
  @ApiOperation({ summary: "Change reservation status" })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  async changeStatus(
    @Param("id") id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.reservationsService.changeStatus(id, dto, userId);
  }

  @Patch(":id/reschedule")
  @ApiOperation({ summary: "Reschedule a reservation" })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  async reschedule(
    @Param("id") id: string,
    @Body() dto: RescheduleReservationDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.reservationsService.reschedule(id, dto, userId);
  }

  @Patch(":id/table")
  @ApiOperation({ summary: "Change reservation table" })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  async changeTable(
    @Param("id") id: string,
    @Body() dto: ChangeTableDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.reservationsService.changeTable(id, dto, userId);
  }

  // Quick status actions
  @Post(":id/confirm")
  @ApiOperation({ summary: "Confirm a reservation" })
  async confirm(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.reservationsService.changeStatus(
      id,
      { status: "CONFIRMED" },
      userId,
    );
  }

  @Post(":id/seat")
  @ApiOperation({ summary: "Mark guest as seated" })
  async seat(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.reservationsService.changeStatus(
      id,
      { status: "SEATED" },
      userId,
    );
  }

  @Post(":id/complete")
  @ApiOperation({ summary: "Mark reservation as completed" })
  async complete(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.reservationsService.changeStatus(
      id,
      { status: "COMPLETED" },
      userId,
    );
  }

  @Post(":id/cancel")
  @ApiOperation({ summary: "Cancel a reservation" })
  async cancel(
    @Param("id") id: string,
    @Body("reason") reason: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.reservationsService.changeStatus(
      id,
      { status: "CANCELLED", reason },
      userId,
    );
  }

  @Post(":id/no-show")
  @ApiOperation({ summary: "Mark as no-show" })
  async noShow(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.reservationsService.changeStatus(
      id,
      { status: "NO_SHOW" },
      userId,
    );
  }

  // ============================================
  // AVAILABILITY & CALENDAR
  // ============================================

  @Post("check-availability")
  @ApiOperation({ summary: "Check available time slots" })
  @ApiResponse({ status: 200, type: AvailabilityResponseDto })
  async checkAvailability(@Body() dto: CheckAvailabilityDto) {
    const slots = await this.reservationsService.checkAvailability(dto);
    return {
      date: dto.date,
      partySize: dto.partySize,
      slots,
    };
  }

  @Get("calendar/overview")
  @ApiOperation({ summary: "Get calendar overview for date range" })
  @ApiQuery({ name: "startDate", example: "2024-12-01" })
  @ApiQuery({ name: "endDate", example: "2024-12-31" })
  @ApiResponse({ status: 200, type: [CalendarDayDto] })
  async getCalendarOverview(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.reservationsService.getCalendarOverview(startDate, endDate);
  }

  @Get("calendar/day/:date")
  @ApiOperation({ summary: "Get detailed schedule for a specific day" })
  @ApiParam({ name: "date", example: "2024-12-25" })
  async getDaySchedule(@Param("date") date: string) {
    return this.reservationsService.getDaySchedule(date);
  }
}
