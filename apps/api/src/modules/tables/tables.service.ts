import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { parseISO, startOfDay, endOfDay, format, setHours, setMinutes, addMinutes } from 'date-fns';

@Injectable()
export class TablesService {
    constructor(private prisma: PrismaService) { }

    async findAll(section?: string) {
        return this.prisma.table.findMany({
            where: {
                isActive: true,
                ...(section && { section }),
            },
            orderBy: [{ section: 'asc' }, { number: 'asc' }],
        });
    }

    async findOne(id: string) {
        const table = await this.prisma.table.findUnique({
            where: { id },
        });

        if (!table) {
            throw new NotFoundException('Table not found');
        }

        return table;
    }

    async getTableAvailability(tableId: string, dateStr: string) {
        const date = parseISO(dateStr);

        const reservations = await this.prisma.reservation.findMany({
            where: {
                tableId,
                date: startOfDay(date),
                status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            },
            orderBy: { startTime: 'asc' },
        });

        // Generate time slots (10 AM - 10 PM, 30-minute intervals)
        const slots = [];
        for (let hour = 10; hour < 22; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const slotTime = setMinutes(setHours(date, hour), minute);
                const slotEnd = addMinutes(slotTime, 90); // 90-minute duration

                const isOccupied = reservations.some((r) => {
                    return slotTime >= r.startTime && slotTime < r.endTime;
                });

                const conflictingReservation = reservations.find((r) => {
                    return slotTime >= r.startTime && slotTime < r.endTime;
                });

                slots.push({
                    time: format(slotTime, 'HH:mm'),
                    available: !isOccupied,
                    reservation: conflictingReservation
                        ? {
                            id: conflictingReservation.id,
                            guestName: conflictingReservation.guestName,
                            partySize: conflictingReservation.partySize,
                            startTime: format(conflictingReservation.startTime, 'HH:mm'),
                            endTime: format(conflictingReservation.endTime, 'HH:mm'),
                            status: conflictingReservation.status,
                        }
                        : null,
                });
            }
        }

        return {
            tableId,
            date: format(date, 'yyyy-MM-dd'),
            slots,
        };
    }
}
