import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { getQueueToken } from "@nestjs/bullmq";
import { OrdersService } from "./orders.service";
import { PrismaService } from "../../database/prisma.service";
import { OrdersGateway } from "./orders.gateway";
import { OrderType } from "./dto/create-order.dto";
import { OrderStatus } from "./dto/update-order-status.dto";

describe("OrdersService", () => {
  let service: OrdersService;

  // Mock functions
  const mockTableFindFirst = jest.fn();
  const mockRestaurantFindUnique = jest.fn();
  const mockMenuItemFindMany = jest.fn();
  const mockOrderCreate = jest.fn();
  const mockOrderFindFirst = jest.fn();
  const mockOrderFindMany = jest.fn();
  const mockOrderCount = jest.fn();
  const mockOrderUpdate = jest.fn();
  const mockOrderGroupBy = jest.fn();
  const mockOrderAggregate = jest.fn();
  const mockTableUpdate = jest.fn();
  const mockOrderStatusHistoryCreate = jest.fn();
  const mockTransaction = jest.fn();
  const mockQueueAdd = jest.fn();
  const mockBroadcastNewOrder = jest.fn();
  const mockBroadcastOrderUpdate = jest.fn();

  // Test data
  const restaurantId = "restaurant-1";
  const userId = "user-1";

  const mockRestaurant = {
    id: restaurantId,
    taxRate: 10,
  };

  const mockTable = {
    id: "table-1",
    number: "1",
    status: "AVAILABLE",
    restaurantId,
  };

  const mockMenuItem = {
    id: "menu-item-1",
    name: "Burger",
    price: 10.0,
    isActive: true,
    isAvailable: true,
    preparationTime: 15,
    restaurantId,
    modifierGroups: [],
  };

  const mockOrder = {
    id: "order-1",
    orderNumber: "20260126-0001",
    type: "DINE_IN",
    status: "PENDING",
    subtotal: 20.0,
    taxAmount: 2.0,
    discountAmount: 0,
    total: 22.0,
    tableId: "table-1",
    createdById: userId,
    restaurantId,
    items: [
      {
        id: "item-1",
        menuItemId: "menu-item-1",
        quantity: 2,
        unitPrice: 10.0,
        totalPrice: 20.0,
        menuItem: mockMenuItem,
        modifiers: [],
      },
    ],
    table: mockTable,
    createdBy: { id: userId, firstName: "John", lastName: "Doe" },
    statusHistory: [],
    createdAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup transaction mock
    mockTransaction.mockImplementation(async (callback) => {
      const tx = {
        order: {
          create: mockOrderCreate,
          update: mockOrderUpdate,
          count: mockOrderCount,
        },
        table: { update: mockTableUpdate },
        orderStatusHistory: { create: mockOrderStatusHistoryCreate },
        orderItem: {
          update: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
        },
      };
      return callback(tx);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            table: { findFirst: mockTableFindFirst },
            restaurant: { findUnique: mockRestaurantFindUnique },
            menuItem: { findMany: mockMenuItemFindMany },
            order: {
              create: mockOrderCreate,
              findFirst: mockOrderFindFirst,
              findMany: mockOrderFindMany,
              count: mockOrderCount,
              update: mockOrderUpdate,
              groupBy: mockOrderGroupBy,
              aggregate: mockOrderAggregate,
            },
            $transaction: mockTransaction,
          },
        },
        {
          provide: OrdersGateway,
          useValue: {
            broadcastNewOrder: mockBroadcastNewOrder,
            broadcastOrderUpdate: mockBroadcastOrderUpdate,
          },
        },
        {
          provide: getQueueToken("orders"),
          useValue: {
            add: mockQueueAdd,
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe("create", () => {
    const createOrderDto = {
      type: OrderType.DINE_IN,
      tableId: "table-1",
      items: [{ menuItemId: "menu-item-1", quantity: 2 }],
    };

    it("should create a dine-in order successfully", async () => {
      // Arrange
      mockTableFindFirst.mockResolvedValue(mockTable);
      mockRestaurantFindUnique.mockResolvedValue(mockRestaurant);
      mockMenuItemFindMany.mockResolvedValue([mockMenuItem]);
      mockOrderFindFirst.mockResolvedValue(null); // For order number generation
      mockOrderCreate.mockResolvedValue(mockOrder);
      mockQueueAdd.mockResolvedValue({});

      // Act
      const result = await service.create(createOrderDto, userId, restaurantId);

      // Assert
      expect(result).toBeDefined();
      expect(result.orderNumber).toBe(mockOrder.orderNumber);
      expect(mockTableFindFirst).toHaveBeenCalledWith({
        where: { id: "table-1", restaurantId },
      });
      expect(mockQueueAdd).toHaveBeenCalledWith(
        "process-order",
        expect.objectContaining({ orderId: mockOrder.id }),
        expect.any(Object),
      );
      expect(mockBroadcastNewOrder).toHaveBeenCalledWith(
        restaurantId,
        mockOrder,
      );
    });

    it("should throw BadRequestException if table not provided for dine-in", async () => {
      // Arrange
      const dtoWithoutTable = {
        type: OrderType.DINE_IN,
        items: [{ menuItemId: "menu-item-1", quantity: 1 }],
      };

      // Act & Assert
      await expect(
        service.create(dtoWithoutTable, userId, restaurantId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(dtoWithoutTable, userId, restaurantId),
      ).rejects.toThrow("Table is required for dine-in orders");
    });

    it("should throw BadRequestException if table not found", async () => {
      // Arrange
      mockTableFindFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.create(createOrderDto, userId, restaurantId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(createOrderDto, userId, restaurantId),
      ).rejects.toThrow("Table not found");
    });

    it("should throw BadRequestException if table is out of service", async () => {
      // Arrange
      mockTableFindFirst.mockResolvedValue({
        ...mockTable,
        status: "OUT_OF_SERVICE",
      });

      // Act & Assert
      await expect(
        service.create(createOrderDto, userId, restaurantId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(createOrderDto, userId, restaurantId),
      ).rejects.toThrow("Table is out of service");
    });

    it("should throw BadRequestException if menu item not found", async () => {
      // Arrange
      mockTableFindFirst.mockResolvedValue(mockTable);
      mockRestaurantFindUnique.mockResolvedValue(mockRestaurant);
      mockMenuItemFindMany.mockResolvedValue([]); // No menu items found

      // Act & Assert
      await expect(
        service.create(createOrderDto, userId, restaurantId),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if menu item is unavailable", async () => {
      // Arrange
      mockTableFindFirst.mockResolvedValue(mockTable);
      mockRestaurantFindUnique.mockResolvedValue(mockRestaurant);
      mockMenuItemFindMany.mockResolvedValue([
        { ...mockMenuItem, isAvailable: false },
      ]);

      // Act & Assert
      await expect(
        service.create(createOrderDto, userId, restaurantId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(createOrderDto, userId, restaurantId),
      ).rejects.toThrow(/currently unavailable/);
    });

    it("should calculate totals correctly with tax", async () => {
      // Arrange
      mockTableFindFirst.mockResolvedValue(mockTable);
      mockRestaurantFindUnique.mockResolvedValue({
        ...mockRestaurant,
        taxRate: 10,
      });
      mockMenuItemFindMany.mockResolvedValue([mockMenuItem]);
      mockOrderFindFirst.mockResolvedValue(null);

      // Capture the order creation arguments
      mockOrderCreate.mockImplementation((args) => {
        // Verify calculations: 2 items * $10 = $20 subtotal, 10% tax = $2, total = $22
        expect(args.data.subtotal).toBe(20);
        expect(args.data.taxAmount).toBeCloseTo(2, 2);
        expect(args.data.total).toBeCloseTo(22, 2);
        return mockOrder;
      });
      mockQueueAdd.mockResolvedValue({});

      // Act
      await service.create(createOrderDto, userId, restaurantId);

      // Assert
      expect(mockOrderCreate).toHaveBeenCalled();
    });

    it("should apply discount correctly", async () => {
      // Arrange
      const dtoWithDiscount = {
        ...createOrderDto,
        discountAmount: 5,
        discountReason: "Loyalty discount",
      };

      mockTableFindFirst.mockResolvedValue(mockTable);
      mockRestaurantFindUnique.mockResolvedValue(mockRestaurant);
      mockMenuItemFindMany.mockResolvedValue([mockMenuItem]);
      mockOrderFindFirst.mockResolvedValue(null);

      mockOrderCreate.mockImplementation((args) => {
        // $20 subtotal + $2 tax - $5 discount = $17 total
        expect(args.data.discountAmount).toBe(5);
        expect(args.data.total).toBeCloseTo(17, 2);
        return mockOrder;
      });
      mockQueueAdd.mockResolvedValue({});

      // Act
      await service.create(dtoWithDiscount, userId, restaurantId);

      // Assert
      expect(mockOrderCreate).toHaveBeenCalled();
    });

    it("should update table status to OCCUPIED for dine-in orders", async () => {
      // Arrange
      mockTableFindFirst.mockResolvedValue(mockTable);
      mockRestaurantFindUnique.mockResolvedValue(mockRestaurant);
      mockMenuItemFindMany.mockResolvedValue([mockMenuItem]);
      mockOrderFindFirst.mockResolvedValue(null);
      mockOrderCreate.mockResolvedValue(mockOrder);
      mockQueueAdd.mockResolvedValue({});

      // Act
      await service.create(createOrderDto, userId, restaurantId);

      // Assert
      expect(mockTableUpdate).toHaveBeenCalledWith({
        where: { id: "table-1" },
        data: { status: "OCCUPIED" },
      });
    });

    it("should create order for takeout without table", async () => {
      // Arrange
      const takeoutDto = {
        type: OrderType.TAKEAWAY,
        items: [{ menuItemId: "menu-item-1", quantity: 1 }],
        customerName: "Jane Doe",
        customerPhone: "123456789",
      };

      mockRestaurantFindUnique.mockResolvedValue(mockRestaurant);
      mockMenuItemFindMany.mockResolvedValue([mockMenuItem]);
      mockOrderFindFirst.mockResolvedValue(null);
      mockOrderCreate.mockResolvedValue({
        ...mockOrder,
        type: "TAKEAWAY",
        tableId: null,
      });
      mockQueueAdd.mockResolvedValue({});

      // Act
      const result = await service.create(takeoutDto, userId, restaurantId);

      // Assert
      expect(result).toBeDefined();
      expect(mockTableFindFirst).not.toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should return paginated orders", async () => {
      // Arrange
      mockOrderFindMany.mockResolvedValue([mockOrder]);
      mockOrderCount.mockResolvedValue(1);

      // Act
      const result = await service.findAll(restaurantId, {});

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it("should filter by status", async () => {
      // Arrange
      mockOrderFindMany.mockResolvedValue([mockOrder]);
      mockOrderCount.mockResolvedValue(1);

      // Act
      await service.findAll(restaurantId, { status: OrderStatus.PENDING });

      // Assert
      expect(mockOrderFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PENDING",
          }),
        }),
      );
    });

    it("should filter by multiple statuses", async () => {
      // Arrange
      mockOrderFindMany.mockResolvedValue([mockOrder]);
      mockOrderCount.mockResolvedValue(1);

      // Act
      await service.findAll(restaurantId, {
        statuses: [OrderStatus.PENDING, OrderStatus.CONFIRMED],
      });

      // Assert
      expect(mockOrderFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ["PENDING", "CONFIRMED"] },
          }),
        }),
      );
    });

    it("should filter by date range", async () => {
      // Arrange
      mockOrderFindMany.mockResolvedValue([]);
      mockOrderCount.mockResolvedValue(0);

      // Act
      await service.findAll(restaurantId, {
        dateFrom: "2026-01-01",
        dateTo: "2026-01-31",
      });

      // Assert
      expect(mockOrderFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it("should search by order number, customer name, or phone", async () => {
      // Arrange
      mockOrderFindMany.mockResolvedValue([mockOrder]);
      mockOrderCount.mockResolvedValue(1);

      // Act
      await service.findAll(restaurantId, { search: "0001" });

      // Assert
      expect(mockOrderFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ orderNumber: expect.any(Object) }),
              expect.objectContaining({ customerName: expect.any(Object) }),
              expect.objectContaining({ customerPhone: expect.any(Object) }),
            ]),
          }),
        }),
      );
    });

    it("should handle pagination correctly", async () => {
      // Arrange
      mockOrderFindMany.mockResolvedValue([mockOrder]);
      mockOrderCount.mockResolvedValue(50);

      // Act
      const result = await service.findAll(restaurantId, {
        page: 2,
        limit: 10,
      });

      // Assert
      expect(mockOrderFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
      expect(result.meta.totalPages).toBe(5);
      expect(result.meta.hasMore).toBe(true);
    });
  });

  describe("findOne", () => {
    it("should return an order by ID", async () => {
      // Arrange
      mockOrderFindFirst.mockResolvedValue(mockOrder);

      // Act
      const result = await service.findOne("order-1", restaurantId);

      // Assert
      expect(result).toEqual(mockOrder);
      expect(mockOrderFindFirst).toHaveBeenCalledWith({
        where: { id: "order-1", restaurantId },
        include: expect.any(Object),
      });
    });

    it("should throw NotFoundException if order not found", async () => {
      // Arrange
      mockOrderFindFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.findOne("nonexistent", restaurantId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne("nonexistent", restaurantId),
      ).rejects.toThrow("Order not found");
    });
  });

  describe("updateStatus", () => {
    it("should update order status successfully", async () => {
      // Arrange
      mockOrderFindFirst.mockResolvedValue(mockOrder);
      mockOrderUpdate.mockResolvedValue({ ...mockOrder, status: "CONFIRMED" });

      // Act
      const result = await service.updateStatus(
        "order-1",
        { status: OrderStatus.CONFIRMED },
        restaurantId,
      );

      // Assert
      expect(result.status).toBe("CONFIRMED");
      expect(mockOrderStatusHistoryCreate).toHaveBeenCalled();
      expect(mockBroadcastOrderUpdate).toHaveBeenCalled();
    });

    it("should update table to CLEANING when order is COMPLETED", async () => {
      // Arrange
      const servedOrder = { ...mockOrder, status: "SERVED" };
      mockOrderFindFirst.mockResolvedValue(servedOrder);
      mockOrderUpdate.mockResolvedValue({
        ...servedOrder,
        status: "COMPLETED",
      });

      // Act
      await service.updateStatus(
        "order-1",
        { status: OrderStatus.COMPLETED },
        restaurantId,
      );

      // Assert
      expect(mockTableUpdate).toHaveBeenCalledWith({
        where: { id: "table-1" },
        data: { status: "CLEANING" },
      });
    });

    it("should set actualReadyAt when status changes to READY", async () => {
      // Arrange
      const preparingOrder = { ...mockOrder, status: "PREPARING" };
      mockOrderFindFirst.mockResolvedValue(preparingOrder);
      mockOrderUpdate.mockImplementation((args) => {
        expect(args.data.actualReadyAt).toBeDefined();
        return { ...preparingOrder, status: "READY" };
      });

      // Act
      await service.updateStatus(
        "order-1",
        { status: OrderStatus.READY },
        restaurantId,
      );

      // Assert
      expect(mockOrderUpdate).toHaveBeenCalled();
    });

    it("should set payment info when order is COMPLETED", async () => {
      // Arrange
      const servedOrder = { ...mockOrder, status: "SERVED" };
      mockOrderFindFirst.mockResolvedValue(servedOrder);
      mockOrderUpdate.mockImplementation((args) => {
        expect(args.data.paidAt).toBeDefined();
        expect(args.data.paymentStatus).toBe("PAID");
        return { ...servedOrder, status: "COMPLETED" };
      });

      // Act
      await service.updateStatus(
        "order-1",
        { status: OrderStatus.COMPLETED },
        restaurantId,
      );

      // Assert
      expect(mockOrderUpdate).toHaveBeenCalled();
    });
  });

  describe("cancel", () => {
    it("should cancel a pending order", async () => {
      // Arrange
      mockOrderFindFirst
        .mockResolvedValueOnce(mockOrder) // First call in cancel
        .mockResolvedValueOnce(mockOrder); // Second call in updateStatus -> findOne
      mockOrderUpdate.mockResolvedValue({ ...mockOrder, status: "CANCELLED" });
      mockOrderCount.mockResolvedValue(0); // No other active orders on table

      // Act
      const result = await service.cancel(
        "order-1",
        "Customer request",
        restaurantId,
      );

      // Assert
      expect(result.status).toBe("CANCELLED");
    });

    it("should throw BadRequestException if order is already completed", async () => {
      // Arrange
      const completedOrder = { ...mockOrder, status: "COMPLETED" };
      mockOrderFindFirst.mockResolvedValue(completedOrder);

      // Act & Assert
      await expect(
        service.cancel("order-1", "Test", restaurantId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.cancel("order-1", "Test", restaurantId),
      ).rejects.toThrow("Order cannot be cancelled");
    });

    it("should throw BadRequestException if order is already cancelled", async () => {
      // Arrange
      const cancelledOrder = { ...mockOrder, status: "CANCELLED" };
      mockOrderFindFirst.mockResolvedValue(cancelledOrder);

      // Act & Assert
      await expect(
        service.cancel("order-1", "Test", restaurantId),
      ).rejects.toThrow(BadRequestException);
    });

    it("should set table to AVAILABLE if no other active orders when cancelled", async () => {
      // Arrange
      mockOrderFindFirst.mockResolvedValue(mockOrder);
      mockOrderUpdate.mockResolvedValue({ ...mockOrder, status: "CANCELLED" });
      mockOrderCount.mockResolvedValue(0); // No other active orders

      // Act
      await service.cancel("order-1", "Customer left", restaurantId);

      // Assert
      expect(mockTableUpdate).toHaveBeenCalledWith({
        where: { id: "table-1" },
        data: { status: "AVAILABLE" },
      });
    });
  });

  describe("getTodayStats", () => {
    it("should return today statistics", async () => {
      // Arrange
      mockOrderGroupBy.mockResolvedValue([
        { status: "PENDING", _count: { id: 5 }, _sum: { total: 100 } },
        { status: "COMPLETED", _count: { id: 10 }, _sum: { total: 500 } },
        { status: "CANCELLED", _count: { id: 2 }, _sum: { total: 50 } },
      ]);
      mockOrderAggregate.mockResolvedValue({
        _count: { id: 15 },
        _sum: { total: 600 },
        _avg: { total: 40 },
      });

      // Act
      const result = await service.getTodayStats(restaurantId);

      // Assert
      expect(result.totalOrders).toBe(15);
      expect(result.totalRevenue).toBe(600);
      expect(result.averageOrderValue).toBe(40);
      expect(result.pendingOrders).toBe(5);
      expect(result.completedOrders).toBe(10);
      expect(result.cancelledOrders).toBe(2);
    });

    it("should handle empty stats", async () => {
      // Arrange
      mockOrderGroupBy.mockResolvedValue([]);
      mockOrderAggregate.mockResolvedValue({
        _count: { id: 0 },
        _sum: { total: null },
        _avg: { total: null },
      });

      // Act
      const result = await service.getTodayStats(restaurantId);

      // Assert
      expect(result.totalOrders).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.averageOrderValue).toBe(0);
    });
  });

  describe("Order Number Generation", () => {
    it("should generate order number with date prefix and sequence", async () => {
      // Arrange
      const takeoutDto = {
        type: OrderType.TAKEAWAY,
        items: [{ menuItemId: "menu-item-1", quantity: 1 }],
      };

      mockRestaurantFindUnique.mockResolvedValue(mockRestaurant);
      mockMenuItemFindMany.mockResolvedValue([mockMenuItem]);
      mockOrderFindFirst.mockResolvedValue(null); // No existing orders
      mockOrderCreate.mockImplementation((args) => {
        // Should be YYYYMMDD-0001 format
        expect(args.data.orderNumber).toMatch(/^\d{8}-0001$/);
        return mockOrder;
      });
      mockQueueAdd.mockResolvedValue({});

      // Act
      await service.create(takeoutDto, userId, restaurantId);

      // Assert
      expect(mockOrderCreate).toHaveBeenCalled();
    });

    it("should increment sequence for subsequent orders", async () => {
      // Arrange
      const takeoutDto = {
        type: OrderType.TAKEAWAY,
        items: [{ menuItemId: "menu-item-1", quantity: 1 }],
      };

      const existingOrder = {
        orderNumber: "20260126-0042",
      };

      mockRestaurantFindUnique.mockResolvedValue(mockRestaurant);
      mockMenuItemFindMany.mockResolvedValue([mockMenuItem]);
      mockOrderFindFirst.mockResolvedValue(existingOrder);
      mockOrderCreate.mockImplementation((args) => {
        // Should increment to 0043
        expect(args.data.orderNumber).toMatch(/-0043$/);
        return mockOrder;
      });
      mockQueueAdd.mockResolvedValue({});

      // Act
      await service.create(takeoutDto, userId, restaurantId);

      // Assert
      expect(mockOrderCreate).toHaveBeenCalled();
    });
  });
});
