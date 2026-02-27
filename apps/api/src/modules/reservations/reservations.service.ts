import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { Prisma, ReservationStatus, Reservation } from "@prisma/client";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  format,
  addMinutes,
  setHours,
  setMinutes,
  eachDayOfInterval,
  isWithinInterval,
  areIntervalsOverlapping,
} from "date-fns";
import { nanoid } from "nanoid";
import {
  CreateReservationDto,
  UpdateReservationDto,
  RescheduleReservationDto,
  ChangeTableDto,
  ChangeStatusDto,
  ReservationQueryDto,
  CheckAvailabilityDto,
  TimeSlotDto,
  CalendarDayDto,
} from "./dto/reservation.dto";

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  // Operating hours - could be moved to config
  private readonly operatingHours = {
    open: 10, // 10:00 AM
    close: 22, // 10:00 PM
    slotInterval: 30, // 30-minute slots
    defaultDuration: 90, // 90 minutes
    bufferTime: 15, // Buffer between reservations
  };

  constructor(private prisma: PrismaService) {}

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  async create(
    dto: CreateReservationDto,
    userId?: string,
  ): Promise<Reservation> {
    // Parse date and time
    const { startTime, endTime } = this.parseDateTime(
      dto.date,
      dto.startTime,
      dto.duration || this.operatingHours.defaultDuration,
    );

    // Check for conflicts if table is specified
    if (dto.tableId) {
      await this.checkTableAvailability(dto.tableId, startTime, endTime);
    }

    // Auto-assign table if not specified
    let tableId = dto.tableId;
    if (!tableId) {
      const availableTable = await this.findAvailableTable(
        startTime,
        endTime,
        dto.partySize,
      );
      tableId = availableTable?.id;
    }

    // Generate confirmation code
    const confirmationCode = this.generateConfirmationCode();

    // Determine Restaurant ID (assuming default or from context)
    // NOTE: In a real multi-tenant app, we'd need context. Here assuming single restaurant or defaulting.
    const restaurant = await this.prisma.restaurant.findFirst();
    if (!restaurant) throw new BadRequestException("No restaurant configured");

    // Create reservation
    const reservation = await this.prisma.reservation.create({
      data: {
        guestName: dto.guestName,
        guestEmail: dto.guestEmail,
        guestPhone: dto.guestPhone,
        partySize: dto.partySize,
        date: startOfDay(parseISO(dto.date)),
        startTime,
        endTime,
        duration: dto.duration || this.operatingHours.defaultDuration,
        tableId,
        source: dto.source || "WALK_IN",
        celebrationType: dto.celebrationType,
        celebrationNote: dto.celebrationNote,
        dietaryNotes: dto.dietaryNotes,
        seatingPreference: dto.seatingPreference,
        specialRequests: dto.specialRequests,
        isVIP: dto.isVIP || false,
        guestId: dto.guestId,
        confirmationCode,
        createdBy: userId,
        // Auto-confirm if created by staff
        status: userId ? "CONFIRMED" : "PENDING",
        confirmedAt: userId ? new Date() : null,
        confirmedBy: userId,
        restaurantId: restaurant.id,
      },
      include: {
        table: true,
        guest: true,
      },
    });

    // Log history
    await this.logHistory(
      reservation.id,
      "CREATED",
      null,
      "New reservation created",
      userId,
    );

    // Update guest visit count if linked
    if (dto.guestId) {
      await this.prisma.guest.update({
        where: { id: dto.guestId },
        data: {
          totalVisits: { increment: 1 },
          lastVisitAt: new Date(),
        },
      });
    }

    this.logger.log(
      `Created reservation ${reservation.id} for ${dto.guestName}`,
    );

    return reservation;
  }

  async findAll(query: ReservationQueryDto) {
    const {
      date,
      startDate,
      endDate,
      status,
      tableId,
      search,
      view,
      page = 1,
      limit = 50,
    } = query;

    // Build date range based on view or explicit dates
    let dateStart: Date;
    let dateEnd: Date;

    if (date) {
      const parsedDate = parseISO(date);
      switch (view) {
        case "week":
          dateStart = startOfWeek(parsedDate, { weekStartsOn: 1 });
          dateEnd = endOfWeek(parsedDate, { weekStartsOn: 1 });
          break;
        case "month":
          dateStart = startOfMonth(parsedDate);
          dateEnd = endOfMonth(parsedDate);
          break;
        case "day":
        default:
          dateStart = startOfDay(parsedDate);
          dateEnd = endOfDay(parsedDate);
      }
    } else if (startDate && endDate) {
      dateStart = startOfDay(parseISO(startDate));
      dateEnd = endOfDay(parseISO(endDate));
    } else {
      // Default to today
      dateStart = startOfDay(new Date());
      dateEnd = endOfDay(new Date());
    }

    // Build where clause
    const where: Prisma.ReservationWhereInput = {
      date: {
        gte: dateStart,
        lte: dateEnd,
      },
    };

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (tableId) {
      where.tableId = tableId;
    }

    if (search) {
      where.OR = [
        { guestName: { contains: search, mode: "insensitive" } },
        { guestEmail: { contains: search, mode: "insensitive" } },
        { guestPhone: { contains: search, mode: "insensitive" } },
        { confirmationCode: { contains: search, mode: "insensitive" } },
      ];
    }

    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        include: {
          table: {
            select: {
              id: true,
              name: true,
              section: true,
              maxCapacity: true,
            },
          },
          guest: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              totalVisits: true,
              isVIP: true,
            },
          },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return {
      data: reservations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        dateRange: {
          start: dateStart,
          end: dateEnd,
        },
      },
    };
  }

  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        table: true,
        guest: true,
        history: {
          orderBy: { changedAt: "desc" },
          take: 20,
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation ${id} not found`);
    }

    return reservation;
  }

  async findByConfirmationCode(code: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { confirmationCode: code },
      include: {
        table: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException("Reservation not found");
    }

    return reservation;
  }

  async update(id: string, dto: UpdateReservationDto, userId?: string) {
    const existing = await this.findOne(id);

    // If date/time changed, check availability
    if (dto.date || dto.startTime) {
      const date = dto.date || format(existing.date, "yyyy-MM-dd");
      const time = dto.startTime || format(existing.startTime, "HH:mm");
      const duration = dto.duration || existing.duration;

      const { startTime, endTime } = this.parseDateTime(date, time, duration);

      const tableId = dto.tableId || existing.tableId;
      if (tableId) {
        await this.checkTableAvailability(tableId, startTime, endTime, id);
      }
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: dto as any,
      include: {
        table: true,
        guest: true,
      },
    });

    await this.logHistory(id, "UPDATED", existing, updated, userId);

    return updated;
  }

  async remove(id: string, userId?: string) {
    const reservation = await this.findOne(id);

    await this.prisma.reservation.delete({
      where: { id },
    });

    this.logger.log(`Deleted reservation ${id}`);

    return { success: true };
  }

  // ============================================
  // STATUS MANAGEMENT
  // ============================================

  async changeStatus(id: string, dto: ChangeStatusDto, userId?: string) {
    const reservation = await this.findOne(id);
    const previousStatus = reservation.status;

    // Validate status transition
    this.validateStatusTransition(previousStatus, dto.status);

    // Build update data based on new status
    const updateData: Prisma.ReservationUpdateInput = {
      status: dto.status,
    };

    switch (dto.status) {
      case "CONFIRMED":
        updateData.confirmedAt = new Date();
        updateData.confirmedBy = userId;
        break;
      case "SEATED":
        updateData.seatedAt = new Date();
        break;
      case "COMPLETED":
        updateData.completedAt = new Date();
        break;
      case "CANCELLED":
        updateData.cancelledAt = new Date();
        updateData.cancelReason = dto.reason;
        break;
      case "NO_SHOW":
        updateData.noShowAt = new Date();
        break;
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: updateData,
      include: {
        table: true,
        guest: true,
      },
    });

    await this.logHistory(
      id,
      "STATUS_CHANGED",
      previousStatus,
      dto.status,
      userId,
      dto.reason,
    );

    return updated;
  }

  // ============================================
  // RESCHEDULE & TABLE CHANGE
  // ============================================

  async reschedule(id: string, dto: RescheduleReservationDto, userId?: string) {
    const reservation = await this.findOne(id);

    // Parse new date/time
    const { startTime, endTime } = this.parseDateTime(
      dto.date,
      dto.startTime,
      reservation.duration,
    );

    // Check table availability
    const tableId = dto.tableId || reservation.tableId;
    if (tableId) {
      await this.checkTableAvailability(tableId, startTime, endTime, id);
    }

    const previousData = {
      date: reservation.date,
      startTime: reservation.startTime,
      tableId: reservation.tableId,
    };

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: {
        date: startOfDay(parseISO(dto.date)),
        startTime,
        endTime,
        tableId,
      },
      include: {
        table: true,
        guest: true,
      },
    });

    await this.logHistory(
      id,
      "RESCHEDULED",
      JSON.stringify(previousData),
      JSON.stringify({
        date: updated.date,
        startTime: updated.startTime,
        tableId: updated.tableId,
      }),
      userId,
      dto.reason,
    );

    return updated;
  }

  async changeTable(id: string, dto: ChangeTableDto, userId?: string) {
    const reservation = await this.findOne(id);

    // Verify table exists and has capacity
    const table = await this.prisma.table.findUnique({
      where: { id: dto.tableId },
    });

    if (!table) {
      throw new NotFoundException("Table not found");
    }

    if (table.maxCapacity < reservation.partySize) {
      throw new BadRequestException(
        `Table capacity (${table.maxCapacity}) is less than party size (${reservation.partySize})`,
      );
    }

    // Check table availability
    await this.checkTableAvailability(
      dto.tableId,
      reservation.startTime,
      reservation.endTime,
      id,
    );

    const previousTableId = reservation.tableId;

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { tableId: dto.tableId },
      include: {
        table: true,
        guest: true,
      },
    });

    await this.logHistory(
      id,
      "TABLE_CHANGED",
      previousTableId,
      dto.tableId,
      userId,
      dto.reason,
    );

    return updated;
  }

  // ============================================
  // AVAILABILITY & CALENDAR
  // ============================================

  async checkAvailability(dto: CheckAvailabilityDto): Promise<TimeSlotDto[]> {
    const date = parseISO(dto.date);
    const duration = dto.duration || this.operatingHours.defaultDuration;

    // Get all tables that can accommodate the party size
    const suitableTables = await this.prisma.table.findMany({
      where: {
        maxCapacity: { gte: dto.partySize },
        minCapacity: { lte: dto.partySize },
        isActive: true,
      },
    });

    if (suitableTables.length === 0) {
      return [];
    }

    // Get all reservations for the date
    const existingReservations = await this.prisma.reservation.findMany({
      where: {
        date: startOfDay(date),
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        tableId: { in: suitableTables.map((t) => t.id) },
      },
    });

    // Generate time slots
    const slots: TimeSlotDto[] = [];
    const { open, close, slotInterval, bufferTime } = this.operatingHours;

    for (let hour = open; hour < close; hour++) {
      for (let minute = 0; minute < 60; minute += slotInterval) {
        const slotStart = setMinutes(setHours(date, hour), minute);
        const slotEnd = addMinutes(slotStart, duration);

        // Skip if slot would end after closing
        if (slotEnd.getHours() >= close && slotEnd.getMinutes() > 0) {
          continue;
        }

        // Find available tables for this slot
        const availableTableIds = suitableTables
          .filter((table) => {
            const tableReservations = existingReservations.filter(
              (r) => r.tableId === table.id,
            );

            return !tableReservations.some((r) =>
              areIntervalsOverlapping(
                { start: slotStart, end: slotEnd },
                {
                  start: addMinutes(r.startTime, -bufferTime),
                  end: addMinutes(r.endTime, bufferTime),
                },
              ),
            );
          })
          .map((t) => t.id);

        slots.push({
          time: format(slotStart, "HH:mm"),
          available: availableTableIds.length > 0,
          availableTables: availableTableIds.length,
          tableIds: availableTableIds,
        });
      }
    }

    return slots;
  }

  async getCalendarOverview(
    startDate: string,
    endDate: string,
  ): Promise<CalendarDayDto[]> {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days = eachDayOfInterval({ start, end });

    // Get all reservations in range
    const reservations = await this.prisma.reservation.findMany({
      where: {
        date: {
          gte: startOfDay(start),
          lte: endOfDay(end),
        },
        status: { notIn: ["CANCELLED"] },
      },
      select: {
        date: true,
        partySize: true,
        status: true,
      },
    });

    // Calculate average for peak detection
    const dailyCounts = days.map((day) => {
      const dayReservations = reservations.filter(
        (r) => format(r.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"),
      );
      return dayReservations.length;
    });
    const averageCount =
      dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length || 0;
    const peakThreshold = averageCount * 1.3;

    return days.map((day) => {
      const dayReservations = reservations.filter(
        (r) => format(r.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"),
      );

      const confirmedCount = dayReservations.filter(
        (r) => r.status === "CONFIRMED" || r.status === "SEATED",
      ).length;
      const pendingCount = dayReservations.filter(
        (r) => r.status === "PENDING",
      ).length;
      const waitlistCount = dayReservations.filter(
        (r) => r.status === "WAITLIST",
      ).length;

      return {
        date: format(day, "yyyy-MM-dd"),
        totalReservations: dayReservations.length,
        totalGuests: dayReservations.reduce((sum, r) => sum + r.partySize, 0),
        confirmedCount,
        pendingCount,
        waitlistCount,
        isPeakDay: dayReservations.length >= peakThreshold,
      };
    });
  }

  async getDaySchedule(date: string) {
    const parsedDate = parseISO(date);

    const [reservations, tables] = await Promise.all([
      this.prisma.reservation.findMany({
        where: {
          date: startOfDay(parsedDate),
          status: { notIn: ["CANCELLED"] },
        },
        include: {
          table: {
            select: {
              id: true,
              name: true,
              section: true,
              maxCapacity: true,
            },
          },
          guest: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              isVIP: true,
            },
          },
        },
        orderBy: { startTime: "asc" },
      }),
      this.prisma.table.findMany({
        where: { isActive: true },
        orderBy: [{ section: "asc" }, { name: "asc" }],
      }),
    ]);

    // Group reservations by table
    const schedule = tables.map((table) => ({
      table,
      reservations: reservations.filter((r) => r.tableId === table.id),
    }));

    // Add unassigned reservations
    const unassigned = reservations.filter((r) => !r.tableId);

    // Calculate hourly stats
    const hourlyStats = [];
    for (
      let hour = this.operatingHours.open;
      hour < this.operatingHours.close;
      hour++
    ) {
      const hourReservations = reservations.filter((r) => {
        const resHour = r.startTime.getHours();
        return resHour === hour;
      });

      hourlyStats.push({
        hour,
        label: format(setHours(new Date(), hour), "h:mm a"),
        reservationCount: hourReservations.length,
        guestCount: hourReservations.reduce((sum, r) => sum + r.partySize, 0),
      });
    }

    return {
      date: format(parsedDate, "yyyy-MM-dd"),
      schedule,
      unassigned,
      hourlyStats,
      summary: {
        totalReservations: reservations.length,
        totalGuests: reservations.reduce((sum, r) => sum + r.partySize, 0),
        confirmedCount: reservations.filter((r) => r.status === "CONFIRMED")
          .length,
        seatedCount: reservations.filter((r) => r.status === "SEATED").length,
        pendingCount: reservations.filter((r) => r.status === "PENDING").length,
      },
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private parseDateTime(
    dateStr: string,
    timeStr: string,
    duration: number,
  ): { startTime: Date; endTime: Date } {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = parseISO(dateStr);
    const startTime = setMinutes(setHours(date, hours), minutes);
    const endTime = addMinutes(startTime, duration);

    return { startTime, endTime };
  }

  private async checkTableAvailability(
    tableId: string,
    startTime: Date,
    endTime: Date,
    excludeReservationId?: string,
  ): Promise<void> {
    const conflicting = await this.prisma.reservation.findFirst({
      where: {
        tableId,
        id: excludeReservationId ? { not: excludeReservationId } : undefined,
        status: { notIn: ["CANCELLED", "NO_SHOW", "COMPLETED"] },
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime },
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime },
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      },
      include: {
        table: true,
      },
    });

    if (conflicting) {
      throw new ConflictException(
        `Table ${conflicting.table?.name} is already reserved from ${format(
          conflicting.startTime,
          "h:mm a",
        )} to ${format(conflicting.endTime, "h:mm a")}`,
      );
    }
  }

  private async findAvailableTable(
    startTime: Date,
    endTime: Date,
    partySize: number,
  ) {
    const tables = await this.prisma.table.findMany({
      where: {
        maxCapacity: { gte: partySize },
        minCapacity: { lte: partySize },
        isActive: true,
      },
      orderBy: { maxCapacity: "asc" }, // Prefer smaller tables that fit
    });

    for (const table of tables) {
      try {
        await this.checkTableAvailability(table.id, startTime, endTime);
        return table;
      } catch {
        continue;
      }
    }

    return null;
  }

  private validateStatusTransition(
    from: ReservationStatus,
    to: ReservationStatus,
  ): void {
    const validTransitions: Record<ReservationStatus, ReservationStatus[]> = {
      PENDING: ["CONFIRMED", "CANCELLED", "WAITLIST"],
      CONFIRMED: ["SEATED", "CANCELLED", "NO_SHOW"],
      WAITLIST: ["CONFIRMED", "CANCELLED"],
      SEATED: ["COMPLETED"],
      COMPLETED: [],
      CANCELLED: [],
      NO_SHOW: [],
      REMINDED: ["SEATED", "CANCELLED", "NO_SHOW"], // Existing status
    };

    if (!validTransitions[from].includes(to)) {
      throw new BadRequestException(
        `Cannot change status from ${from} to ${to}`,
      );
    }
  }

  private generateConfirmationCode(): string {
    return nanoid(8).toUpperCase();
  }

  private async logHistory(
    reservationId: string,
    action: string,
    previousValue: any,
    newValue: any,
    changedBy?: string,
    notes?: string,
  ): Promise<void> {
    await this.prisma.reservationHistory.create({
      data: {
        reservationId,
        action,
        previousValue:
          typeof previousValue === "string"
            ? previousValue
            : JSON.stringify(previousValue),
        newValue:
          typeof newValue === "string" ? newValue : JSON.stringify(newValue),
        changedBy,
        notes,
      },
    });
  }
}
