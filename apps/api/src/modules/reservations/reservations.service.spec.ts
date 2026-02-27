import { Test, TestingModule } from '@nestjs/testing';
import {
    BadRequestException,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '@/database/prisma.service';
import { ReservationStatus } from '@prisma/client';

// Mock nanoid
jest.mock('nanoid', () => ({
    nanoid: jest.fn(() => 'TESTCODE'),
}));

describe('ReservationsService', () => {
    let service: ReservationsService;

    // Mock functions
    const mockReservationCreate = jest.fn();
    const mockReservationFindUnique = jest.fn();
    const mockReservationFindMany = jest.fn();
    const mockReservationFindFirst = jest.fn();
    const mockReservationUpdate = jest.fn();
    const mockReservationDelete = jest.fn();
    const mockReservationCount = jest.fn();
    const mockTableFindUnique = jest.fn();
    const mockTableFindMany = jest.fn();
    const mockGuestUpdate = jest.fn();
    const mockRestaurantFindFirst = jest.fn();
    const mockHistoryCreate = jest.fn();

    // Test data
    const restaurantId = 'restaurant-1';
    const userId = 'user-1';

    const mockRestaurant = {
        id: restaurantId,
        name: 'Test Restaurant',
    };

    const mockTable = {
        id: 'table-1',
        name: 'Table 1',
        section: 'Main',
        maxCapacity: 4,
        minCapacity: 2,
        isActive: true,
    };

    const mockReservation = {
        id: 'reservation-1',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        guestPhone: '+1234567890',
        partySize: 2,
        date: new Date('2026-01-26'),
        startTime: new Date('2026-01-26T18:00:00'),
        endTime: new Date('2026-01-26T19:30:00'),
        duration: 90,
        tableId: 'table-1',
        status: 'CONFIRMED' as ReservationStatus,
        confirmationCode: 'ABC12345',
        source: 'WALK_IN',
        restaurantId,
        table: mockTable,
        guest: null,
        history: [],
        createdAt: new Date(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReservationsService,
                {
                    provide: PrismaService,
                    useValue: {
                        reservation: {
                            create: mockReservationCreate,
                            findUnique: mockReservationFindUnique,
                            findMany: mockReservationFindMany,
                            findFirst: mockReservationFindFirst,
                            update: mockReservationUpdate,
                            delete: mockReservationDelete,
                            count: mockReservationCount,
                        },
                        table: {
                            findUnique: mockTableFindUnique,
                            findMany: mockTableFindMany,
                        },
                        guest: {
                            update: mockGuestUpdate,
                        },
                        restaurant: {
                            findFirst: mockRestaurantFindFirst,
                        },
                        reservationHistory: {
                            create: mockHistoryCreate,
                        },
                    },
                },
            ],
        }).compile();

        service = module.get<ReservationsService>(ReservationsService);
    });

    describe('create', () => {
        const createDto = {
            guestName: 'Jane Smith',
            guestEmail: 'jane@example.com',
            guestPhone: '+1987654321',
            partySize: 2,
            date: '2026-01-26',
            startTime: '18:00',
        };

        it('should create a reservation successfully', async () => {
            // Arrange
            mockRestaurantFindFirst.mockResolvedValue(mockRestaurant);
            mockReservationFindFirst.mockResolvedValue(null); // No conflicts
            mockTableFindMany.mockResolvedValue([mockTable]);
            mockReservationCreate.mockResolvedValue(mockReservation);
            mockHistoryCreate.mockResolvedValue({});

            // Act
            const result = await service.create(createDto, userId);

            // Assert
            expect(result).toBeDefined();
            expect(result.id).toBe(mockReservation.id);
            expect(mockReservationCreate).toHaveBeenCalled();
            expect(mockHistoryCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        action: 'CREATED',
                    }),
                }),
            );
        });

        it('should throw BadRequestException if no restaurant configured', async () => {
            // Arrange
            mockRestaurantFindFirst.mockResolvedValue(null);

            // Act & Assert
            await expect(service.create(createDto, userId)).rejects.toThrow(
                BadRequestException,
            );
            await expect(service.create(createDto, userId)).rejects.toThrow(
                'No restaurant configured',
            );
        });

        it('should check table availability when table is specified', async () => {
            // Arrange
            const dtoWithTable = { ...createDto, tableId: 'table-1' };
            mockRestaurantFindFirst.mockResolvedValue(mockRestaurant);
            mockReservationFindFirst.mockResolvedValue(null);
            mockReservationCreate.mockResolvedValue(mockReservation);
            mockHistoryCreate.mockResolvedValue({});

            // Act
            await service.create(dtoWithTable, userId);

            // Assert
            expect(mockReservationFindFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tableId: 'table-1',
                    }),
                }),
            );
        });

        it('should throw ConflictException if table has conflict', async () => {
            // Arrange
            const dtoWithTable = { ...createDto, tableId: 'table-1' };
            mockRestaurantFindFirst.mockResolvedValue(mockRestaurant);
            mockReservationFindFirst.mockResolvedValue({
                ...mockReservation,
                table: mockTable,
            });

            // Act & Assert
            await expect(service.create(dtoWithTable, userId)).rejects.toThrow(
                ConflictException,
            );
        });

        it('should auto-assign table if not specified', async () => {
            // Arrange
            mockRestaurantFindFirst.mockResolvedValue(mockRestaurant);
            mockTableFindMany.mockResolvedValue([mockTable]);
            mockReservationFindFirst.mockResolvedValue(null);
            mockReservationCreate.mockResolvedValue(mockReservation);
            mockHistoryCreate.mockResolvedValue({});

            // Act
            await service.create(createDto, userId);

            // Assert
            expect(mockTableFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        maxCapacity: { gte: createDto.partySize },
                    }),
                }),
            );
        });

        it('should update guest visit count if guest is linked', async () => {
            // Arrange
            const dtoWithGuest = { ...createDto, guestId: 'guest-1' };
            mockRestaurantFindFirst.mockResolvedValue(mockRestaurant);
            mockReservationFindFirst.mockResolvedValue(null);
            mockTableFindMany.mockResolvedValue([mockTable]);
            mockReservationCreate.mockResolvedValue(mockReservation);
            mockHistoryCreate.mockResolvedValue({});
            mockGuestUpdate.mockResolvedValue({});

            // Act
            await service.create(dtoWithGuest, userId);

            // Assert
            expect(mockGuestUpdate).toHaveBeenCalledWith({
                where: { id: 'guest-1' },
                data: {
                    totalVisits: { increment: 1 },
                    lastVisitAt: expect.any(Date),
                },
            });
        });

        it('should set status to CONFIRMED when created by staff', async () => {
            // Arrange
            mockRestaurantFindFirst.mockResolvedValue(mockRestaurant);
            mockReservationFindFirst.mockResolvedValue(null);
            mockTableFindMany.mockResolvedValue([mockTable]);
            mockReservationCreate.mockResolvedValue(mockReservation);
            mockHistoryCreate.mockResolvedValue({});

            // Act
            await service.create(createDto, userId);

            // Assert
            expect(mockReservationCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: 'CONFIRMED',
                        confirmedAt: expect.any(Date),
                        confirmedBy: userId,
                    }),
                }),
            );
        });

        it('should set status to PENDING when created without staff', async () => {
            // Arrange
            mockRestaurantFindFirst.mockResolvedValue(mockRestaurant);
            mockReservationFindFirst.mockResolvedValue(null);
            mockTableFindMany.mockResolvedValue([mockTable]);
            mockReservationCreate.mockResolvedValue({ ...mockReservation, status: 'PENDING' });
            mockHistoryCreate.mockResolvedValue({});

            // Act
            await service.create(createDto); // No userId

            // Assert
            expect(mockReservationCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: 'PENDING',
                        confirmedAt: null,
                    }),
                }),
            );
        });
    });

    describe('findAll', () => {
        it('should return paginated reservations', async () => {
            // Arrange
            mockReservationFindMany.mockResolvedValue([mockReservation]);
            mockReservationCount.mockResolvedValue(1);

            // Act
            const result = await service.findAll({ date: '2026-01-26' });

            // Assert
            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
        });

        it('should filter by status', async () => {
            // Arrange
            mockReservationFindMany.mockResolvedValue([mockReservation]);
            mockReservationCount.mockResolvedValue(1);

            // Act
            await service.findAll({
                date: '2026-01-26',
                status: ['CONFIRMED', 'PENDING'] as ReservationStatus[],
            });

            // Assert
            expect(mockReservationFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: { in: ['CONFIRMED', 'PENDING'] },
                    }),
                }),
            );
        });

        it('should support week view', async () => {
            // Arrange
            mockReservationFindMany.mockResolvedValue([]);
            mockReservationCount.mockResolvedValue(0);

            // Act
            const result = await service.findAll({
                date: '2026-01-26',
                view: 'week',
            });

            // Assert
            expect(result.meta.dateRange).toBeDefined();
            // Week should span 7 days
        });

        it('should support month view', async () => {
            // Arrange
            mockReservationFindMany.mockResolvedValue([]);
            mockReservationCount.mockResolvedValue(0);

            // Act
            const result = await service.findAll({
                date: '2026-01-15',
                view: 'month',
            });

            // Assert
            expect(result.meta.dateRange).toBeDefined();
        });

        it('should search across multiple fields', async () => {
            // Arrange
            mockReservationFindMany.mockResolvedValue([mockReservation]);
            mockReservationCount.mockResolvedValue(1);

            // Act
            await service.findAll({
                date: '2026-01-26',
                search: 'john',
            });

            // Assert
            expect(mockReservationFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            expect.objectContaining({ guestName: expect.any(Object) }),
                            expect.objectContaining({ guestEmail: expect.any(Object) }),
                            expect.objectContaining({ guestPhone: expect.any(Object) }),
                            expect.objectContaining({ confirmationCode: expect.any(Object) }),
                        ]),
                    }),
                }),
            );
        });
    });

    describe('findOne', () => {
        it('should return a reservation by ID', async () => {
            // Arrange
            mockReservationFindUnique.mockResolvedValue(mockReservation);

            // Act
            const result = await service.findOne('reservation-1');

            // Assert
            expect(result).toEqual(mockReservation);
        });

        it('should throw NotFoundException if not found', async () => {
            // Arrange
            mockReservationFindUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(service.findOne('nonexistent')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('findByConfirmationCode', () => {
        it('should return reservation by confirmation code', async () => {
            // Arrange
            mockReservationFindUnique.mockResolvedValue(mockReservation);

            // Act
            const result = await service.findByConfirmationCode('ABC12345');

            // Assert
            expect(result.confirmationCode).toBe('ABC12345');
        });

        it('should throw NotFoundException if code not found', async () => {
            // Arrange
            mockReservationFindUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(
                service.findByConfirmationCode('INVALID'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('changeStatus', () => {
        it('should change status from PENDING to CONFIRMED', async () => {
            // Arrange
            const pendingReservation = { ...mockReservation, status: 'PENDING' as ReservationStatus };
            mockReservationFindUnique.mockResolvedValue(pendingReservation);
            mockReservationUpdate.mockResolvedValue({
                ...mockReservation,
                status: 'CONFIRMED',
            });
            mockHistoryCreate.mockResolvedValue({});

            // Act
            const result = await service.changeStatus(
                'reservation-1',
                { status: 'CONFIRMED' as ReservationStatus },
                userId,
            );

            // Assert
            expect(result.status).toBe('CONFIRMED');
            expect(mockReservationUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: 'CONFIRMED',
                        confirmedAt: expect.any(Date),
                        confirmedBy: userId,
                    }),
                }),
            );
        });

        it('should set seatedAt when status changes to SEATED', async () => {
            // Arrange
            mockReservationFindUnique.mockResolvedValue(mockReservation);
            mockReservationUpdate.mockResolvedValue({
                ...mockReservation,
                status: 'SEATED',
            });
            mockHistoryCreate.mockResolvedValue({});

            // Act
            await service.changeStatus(
                'reservation-1',
                { status: 'SEATED' as ReservationStatus },
                userId,
            );

            // Assert
            expect(mockReservationUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        seatedAt: expect.any(Date),
                    }),
                }),
            );
        });

        it('should set completedAt when status changes to COMPLETED', async () => {
            // Arrange
            const seatedReservation = { ...mockReservation, status: 'SEATED' as ReservationStatus };
            mockReservationFindUnique.mockResolvedValue(seatedReservation);
            mockReservationUpdate.mockResolvedValue({
                ...mockReservation,
                status: 'COMPLETED',
            });
            mockHistoryCreate.mockResolvedValue({});

            // Act
            await service.changeStatus(
                'reservation-1',
                { status: 'COMPLETED' as ReservationStatus },
                userId,
            );

            // Assert
            expect(mockReservationUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        completedAt: expect.any(Date),
                    }),
                }),
            );
        });

        it('should set cancelledAt and reason when CANCELLED', async () => {
            // Arrange
            mockReservationFindUnique.mockResolvedValue(mockReservation);
            mockReservationUpdate.mockResolvedValue({
                ...mockReservation,
                status: 'CANCELLED',
            });
            mockHistoryCreate.mockResolvedValue({});

            // Act
            await service.changeStatus(
                'reservation-1',
                { status: 'CANCELLED' as ReservationStatus, reason: 'Guest cancelled' },
                userId,
            );

            // Assert
            expect(mockReservationUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        cancelledAt: expect.any(Date),
                        cancelReason: 'Guest cancelled',
                    }),
                }),
            );
        });

        it('should throw BadRequestException for invalid status transition', async () => {
            // Arrange - COMPLETED cannot go to PENDING
            const completedReservation = { ...mockReservation, status: 'COMPLETED' as ReservationStatus };
            mockReservationFindUnique.mockResolvedValue(completedReservation);

            // Act & Assert
            await expect(
                service.changeStatus(
                    'reservation-1',
                    { status: 'PENDING' as ReservationStatus },
                    userId,
                ),
            ).rejects.toThrow(BadRequestException);
        });

        it('should log status change in history', async () => {
            // Arrange
            const pendingReservation = { ...mockReservation, status: 'PENDING' as ReservationStatus };
            mockReservationFindUnique.mockResolvedValue(pendingReservation);
            mockReservationUpdate.mockResolvedValue({
                ...mockReservation,
                status: 'CONFIRMED',
            });
            mockHistoryCreate.mockResolvedValue({});

            // Act
            await service.changeStatus(
                'reservation-1',
                { status: 'CONFIRMED' as ReservationStatus },
                userId,
            );

            // Assert
            expect(mockHistoryCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        action: 'STATUS_CHANGED',
                        previousValue: 'PENDING',
                        newValue: 'CONFIRMED',
                    }),
                }),
            );
        });
    });

    describe('reschedule', () => {
        it('should reschedule reservation successfully', async () => {
            // Arrange
            mockReservationFindUnique.mockResolvedValue(mockReservation);
            mockReservationFindFirst.mockResolvedValue(null); // No conflicts
            mockReservationUpdate.mockResolvedValue({
                ...mockReservation,
                date: new Date('2026-01-27'),
                startTime: new Date('2026-01-27T19:00:00'),
            });
            mockHistoryCreate.mockResolvedValue({});

            // Act
            const result = await service.reschedule(
                'reservation-1',
                { date: '2026-01-27', startTime: '19:00' },
                userId,
            );

            // Assert
            expect(result).toBeDefined();
            expect(mockReservationUpdate).toHaveBeenCalled();
        });

        it('should throw ConflictException if new time has conflict', async () => {
            // Arrange
            mockReservationFindUnique.mockResolvedValue(mockReservation);
            mockReservationFindFirst.mockResolvedValue({
                ...mockReservation,
                id: 'other-reservation',
                table: mockTable,
            });

            // Act & Assert
            await expect(
                service.reschedule(
                    'reservation-1',
                    { date: '2026-01-27', startTime: '19:00' },
                    userId,
                ),
            ).rejects.toThrow(ConflictException);
        });

        it('should allow reschedule to different table', async () => {
            // Arrange
            mockReservationFindUnique.mockResolvedValue(mockReservation);
            mockReservationFindFirst.mockResolvedValue(null);
            mockReservationUpdate.mockResolvedValue({
                ...mockReservation,
                tableId: 'table-2',
            });
            mockHistoryCreate.mockResolvedValue({});

            // Act
            await service.reschedule(
                'reservation-1',
                { date: '2026-01-27', startTime: '19:00', tableId: 'table-2' },
                userId,
            );

            // Assert
            expect(mockReservationUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        tableId: 'table-2',
                    }),
                }),
            );
        });
    });

    describe('changeTable', () => {
        it('should change table successfully', async () => {
            // Arrange
            mockReservationFindUnique.mockResolvedValue(mockReservation);
            mockTableFindUnique.mockResolvedValue({ ...mockTable, id: 'table-2' });
            mockReservationFindFirst.mockResolvedValue(null);
            mockReservationUpdate.mockResolvedValue({
                ...mockReservation,
                tableId: 'table-2',
            });
            mockHistoryCreate.mockResolvedValue({});

            // Act
            const result = await service.changeTable(
                'reservation-1',
                { tableId: 'table-2' },
                userId,
            );

            // Assert
            expect(result.tableId).toBe('table-2');
        });

        it('should throw NotFoundException if table not found', async () => {
            // Arrange
            mockReservationFindUnique.mockResolvedValue(mockReservation);
            mockTableFindUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(
                service.changeTable('reservation-1', { tableId: 'nonexistent' }, userId),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if table capacity insufficient', async () => {
            // Arrange
            const largePartyReservation = { ...mockReservation, partySize: 10 };
            mockReservationFindUnique.mockResolvedValue(largePartyReservation);
            mockTableFindUnique.mockResolvedValue({ ...mockTable, maxCapacity: 4 });

            // Act & Assert
            await expect(
                service.changeTable('reservation-1', { tableId: 'table-2' }, userId),
            ).rejects.toThrow(BadRequestException);
            await expect(
                service.changeTable('reservation-1', { tableId: 'table-2' }, userId),
            ).rejects.toThrow(/capacity/i);
        });
    });

    describe('checkAvailability', () => {
        it('should return available time slots', async () => {
            // Arrange
            mockTableFindMany.mockResolvedValue([mockTable]);
            mockReservationFindMany.mockResolvedValue([]);

            // Act
            const result = await service.checkAvailability({
                date: '2026-01-26',
                partySize: 2,
            });

            // Assert
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toHaveProperty('time');
            expect(result[0]).toHaveProperty('available');
        });

        it('should return empty array if no suitable tables', async () => {
            // Arrange
            mockTableFindMany.mockResolvedValue([]);

            // Act
            const result = await service.checkAvailability({
                date: '2026-01-26',
                partySize: 20, // Very large party
            });

            // Assert
            expect(result).toEqual([]);
        });

        it('should mark slots as unavailable when tables are booked', async () => {
            // Arrange
            mockTableFindMany.mockResolvedValue([mockTable]);
            mockReservationFindMany.mockResolvedValue([mockReservation]); // Table booked at 18:00

            // Act
            const result = await service.checkAvailability({
                date: '2026-01-26',
                partySize: 2,
            });

            // Assert
            const slot18 = result.find((s) => s.time === '18:00');
            // Should be unavailable due to existing reservation
            expect(slot18?.available).toBe(false);
        });
    });

    describe('remove', () => {
        it('should delete reservation successfully', async () => {
            // Arrange
            mockReservationFindUnique.mockResolvedValue(mockReservation);
            mockReservationDelete.mockResolvedValue(mockReservation);

            // Act
            const result = await service.remove('reservation-1', userId);

            // Assert
            expect(result).toEqual({ success: true });
            expect(mockReservationDelete).toHaveBeenCalledWith({
                where: { id: 'reservation-1' },
            });
        });

        it('should throw NotFoundException if reservation not found', async () => {
            // Arrange
            mockReservationFindUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(service.remove('nonexistent', userId)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('Status Transition Validation', () => {
        const testCases = [
            { from: 'PENDING', to: 'CONFIRMED', valid: true },
            { from: 'PENDING', to: 'CANCELLED', valid: true },
            { from: 'PENDING', to: 'WAITLIST', valid: true },
            { from: 'PENDING', to: 'SEATED', valid: false },
            { from: 'CONFIRMED', to: 'SEATED', valid: true },
            { from: 'CONFIRMED', to: 'CANCELLED', valid: true },
            { from: 'CONFIRMED', to: 'NO_SHOW', valid: true },
            { from: 'CONFIRMED', to: 'PENDING', valid: false },
            { from: 'SEATED', to: 'COMPLETED', valid: true },
            { from: 'SEATED', to: 'CANCELLED', valid: false },
            { from: 'COMPLETED', to: 'PENDING', valid: false },
            { from: 'CANCELLED', to: 'CONFIRMED', valid: false },
        ];

        testCases.forEach(({ from, to, valid }) => {
            it(`should ${valid ? 'allow' : 'reject'} transition from ${from} to ${to}`, async () => {
                // Arrange
                const reservation = { ...mockReservation, status: from as ReservationStatus };
                mockReservationFindUnique.mockResolvedValue(reservation);

                if (valid) {
                    mockReservationUpdate.mockResolvedValue({
                        ...reservation,
                        status: to,
                    });
                    mockHistoryCreate.mockResolvedValue({});

                    // Act
                    const result = await service.changeStatus(
                        'reservation-1',
                        { status: to as ReservationStatus },
                        userId,
                    );

                    // Assert
                    expect(result.status).toBe(to);
                } else {
                    // Act & Assert
                    await expect(
                        service.changeStatus(
                            'reservation-1',
                            { status: to as ReservationStatus },
                            userId,
                        ),
                    ).rejects.toThrow(BadRequestException);
                }
            });
        });
    });
});
