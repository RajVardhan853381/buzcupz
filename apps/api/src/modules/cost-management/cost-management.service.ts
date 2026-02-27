import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import {
  CostCategoryType,
  CostFrequency,
  CostStatus,
  EmployeeType,
  PaymentFrequency,
} from "@prisma/client";
import {
  CreateCostCategoryDto,
  UpdateCostCategoryDto,
} from "./dto/create-cost-category.dto";
import {
  CreateCostEntryDto,
  UpdateCostEntryDto,
} from "./dto/create-cost-entry.dto";
import { CreateEmployeeDto, UpdateEmployeeDto } from "./dto/employee.dto";
import {
  CreateLaborEntryDto,
  UpdateLaborEntryDto,
} from "./dto/labor-entry.dto";

@Injectable()
export class CostManagementService {
  private readonly logger = new Logger(CostManagementService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== COST CATEGORIES ====================

  async createCategory(restaurantId: string, dto: CreateCostCategoryDto) {
    return this.prisma.costCategory.create({
      data: {
        ...dto,
        restaurantId,
      },
    });
  }

  async findAllCategories(restaurantId: string) {
    return this.prisma.costCategory.findMany({
      where: { restaurantId },
      orderBy: { name: "asc" },
    });
  }

  async findCategoryById(restaurantId: string, id: string) {
    const category = await this.prisma.costCategory.findUnique({
      where: { id },
    });

    if (!category || category.restaurantId !== restaurantId) {
      throw new NotFoundException("Cost category not found");
    }
    return category;
  }

  async updateCategory(
    restaurantId: string,
    id: string,
    dto: UpdateCostCategoryDto,
  ) {
    await this.findCategoryById(restaurantId, id);
    return this.prisma.costCategory.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategory(restaurantId: string, id: string) {
    await this.findCategoryById(restaurantId, id);
    return this.prisma.costCategory.delete({
      where: { id },
    });
  }

  // ==================== COST ENTRIES ====================

  async createCostEntry(
    restaurantId: string,
    dto: CreateCostEntryDto,
    userId?: string,
  ) {
    const entry = await this.prisma.costEntry.create({
      data: {
        ...dto,
        date: new Date(dto.date),
        recurringStartDate: dto.recurringStartDate
          ? new Date(dto.recurringStartDate)
          : undefined,
        recurringEndDate: dto.recurringEndDate
          ? new Date(dto.recurringEndDate)
          : undefined,
        restaurantId,
        createdById: userId,
      },
    });

    if (dto.isRecurring && dto.frequency && dto.recurringEndDate) {
      await this.createRecurringEntries(entry, dto.recurringEndDate);
    }

    return entry;
  }

  private async createRecurringEntries(parentEntry: any, endDateStr: string) {
    const entries = [];
    let currentDate = new Date(parentEntry.date);
    const finalDate = new Date(endDateStr);

    while (currentDate < finalDate) {
      currentDate = this.getNextDate(currentDate, parentEntry.frequency);

      if (currentDate <= finalDate) {
        entries.push({
          amount: parentEntry.amount,
          date: new Date(currentDate),
          description: parentEntry.description,
          reference: parentEntry.reference,
          vendor: parentEntry.vendor,
          status: CostStatus.PENDING,
          frequency: parentEntry.frequency,
          isRecurring: true,
          parentEntryId: parentEntry.id,
          categoryId: parentEntry.categoryId,
          restaurantId: parentEntry.restaurantId,
          createdById: parentEntry.createdById,
        });
      }
    }

    if (entries.length > 0) {
      await this.prisma.costEntry.createMany({
        data: entries,
      });
    }
  }

  private getNextDate(date: Date, frequency: CostFrequency): Date {
    const newDate = new Date(date);
    switch (frequency) {
      case CostFrequency.DAILY:
        newDate.setDate(newDate.getDate() + 1);
        break;
      case CostFrequency.WEEKLY:
        newDate.setDate(newDate.getDate() + 7);
        break;
      case CostFrequency.BI_WEEKLY:
        newDate.setDate(newDate.getDate() + 14);
        break;
      case CostFrequency.MONTHLY:
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case CostFrequency.QUARTERLY:
        newDate.setMonth(newDate.getMonth() + 3);
        break;
      case CostFrequency.YEARLY:
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }
    return newDate;
  }

  async findAllCostEntries(
    restaurantId: string,
    options: {
      startDate?: string;
      endDate?: string;
      categoryId?: string;
      status?: CostStatus;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const {
      startDate,
      endDate,
      categoryId,
      status,
      page = 1,
      limit = 50,
    } = options;
    const where: any = { restaurantId };

    if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
    if (endDate) where.date = { ...where.date, lte: new Date(endDate) };
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;

    const [entries, total] = await Promise.all([
      this.prisma.costEntry.findMany({
        where,
        include: { category: true, createdBy: true },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.costEntry.count({ where }),
    ]);

    return { entries, total };
  }

  async findCostEntryById(restaurantId: string, id: string) {
    const entry = await this.prisma.costEntry.findUnique({
      where: { id },
      include: { category: true, createdBy: true },
    });
    if (!entry || entry.restaurantId !== restaurantId) {
      throw new NotFoundException("Cost entry not found");
    }
    return entry;
  }

  async updateCostEntry(
    restaurantId: string,
    id: string,
    dto: UpdateCostEntryDto,
  ) {
    await this.findCostEntryById(restaurantId, id);
    return this.prisma.costEntry.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      } as any,
    });
  }

  async deleteCostEntry(
    restaurantId: string,
    id: string,
    deleteRecurring = false,
  ) {
    const entry = await this.findCostEntryById(restaurantId, id);
    if (deleteRecurring && entry.isRecurring) {
      await this.prisma.costEntry.deleteMany({
        where: { parentEntryId: entry.id, restaurantId },
      });
    }
    await this.prisma.costEntry.delete({ where: { id } });
  }

  // ==================== EMPLOYEES ====================

  async createEmployee(restaurantId: string, dto: CreateEmployeeDto) {
    // benefits needs to be cast to JSON compatible type or handled by Prisma automatically
    return this.prisma.employee.create({
      data: {
        ...dto,
        hireDate: new Date(dto.hireDate),
        benefits: dto.benefits as any,
        restaurantId,
      },
    });
  }

  async findAllEmployees(restaurantId: string, includeInactive = false) {
    const where: any = { restaurantId };
    if (!includeInactive) where.isActive = true;
    return this.prisma.employee.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  async findEmployeeById(restaurantId: string, id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });
    if (!employee || employee.restaurantId !== restaurantId) {
      throw new NotFoundException("Employee not found");
    }
    return employee;
  }

  async updateEmployee(
    restaurantId: string,
    id: string,
    dto: UpdateEmployeeDto,
  ) {
    await this.findEmployeeById(restaurantId, id);
    return this.prisma.employee.update({
      where: { id },
      data: {
        ...dto,
        terminationDate: dto.terminationDate
          ? new Date(dto.terminationDate)
          : undefined,
        benefits: dto.benefits as any,
      },
    });
  }

  async deleteEmployee(restaurantId: string, id: string) {
    await this.findEmployeeById(restaurantId, id);
    // Soft delete
    return this.prisma.employee.update({
      where: { id },
      data: { isActive: false, terminationDate: new Date() },
    });
  }

  // ==================== LABOR ENTRIES ====================

  async createLaborEntry(restaurantId: string, dto: CreateLaborEntryDto) {
    const employee = await this.findEmployeeById(restaurantId, dto.employeeId);

    const basePay = Number(dto.basePay);
    const overtimePay = Number(dto.overtimePay || 0);
    const bonus = Number(dto.bonus || 0);
    const tips = Number(dto.tips || 0);
    const deductions = Number(dto.deductions || 0);
    const taxes = Number(dto.taxes || 0);

    const grossPay = basePay + overtimePay + bonus;
    const netPay = grossPay - deductions - taxes + tips;

    // Estimate employer costs
    const employerTaxRate = 0.0765;
    // Benefits calculation logic
    let benefitsCost = 0;
    if (employee.benefits && typeof employee.benefits === "object") {
      benefitsCost = Object.values(employee.benefits as any).reduce(
        (sum: number, val: any) => sum + (Number(val) || 0),
        0,
      );
    }

    // Prorate benefits
    const payPeriodBenefits = benefitsCost / 4; // Simplification

    const totalCost = grossPay + grossPay * employerTaxRate + payPeriodBenefits;

    return this.prisma.laborEntry.create({
      data: {
        ...dto,
        payPeriodStart: new Date(dto.payPeriodStart),
        payPeriodEnd: new Date(dto.payPeriodEnd),
        netPay,
        totalCost,
        restaurantId,
      },
    });
  }

  async findAllLaborEntries(restaurantId: string, options: any) {
    const {
      startDate,
      endDate,
      employeeId,
      isPaid,
      page = 1,
      limit = 50,
    } = options;
    const where: any = { restaurantId };

    if (startDate) where.payPeriodStart = { gte: new Date(startDate) };
    if (endDate) where.payPeriodEnd = { lte: new Date(endDate) };
    if (employeeId) where.employeeId = employeeId;
    if (isPaid !== undefined)
      where.isPaid = isPaid === "true" || isPaid === true;

    const [entries, total] = await Promise.all([
      this.prisma.laborEntry.findMany({
        where,
        include: { employee: true },
        orderBy: { payPeriodEnd: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.laborEntry.count({ where }),
    ]);

    return { entries, total };
  }

  async findLaborEntryById(restaurantId: string, id: string) {
    const entry = await this.prisma.laborEntry.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!entry || entry.restaurantId !== restaurantId) {
      throw new NotFoundException("Labor entry not found");
    }
    return entry;
  }

  async updateLaborEntry(
    restaurantId: string,
    id: string,
    dto: UpdateLaborEntryDto,
  ) {
    await this.findLaborEntryById(restaurantId, id);

    // Logic to recalculate netPay/totalCost if amounts changed

    return this.prisma.laborEntry.update({
      where: { id },
      data: {
        ...dto,
        paidDate: dto.paidDate ? new Date(dto.paidDate) : undefined,
      },
    });
  }

  async deleteLaborEntry(restaurantId: string, id: string) {
    await this.findLaborEntryById(restaurantId, id);
    return this.prisma.laborEntry.delete({ where: { id } });
  }

  // ==================== OVERHEAD SETTINGS ====================

  async getOverheadSettings(restaurantId: string) {
    let settings = await this.prisma.overheadSettings.findUnique({
      where: { restaurantId },
    });
    if (!settings) {
      settings = await this.prisma.overheadSettings.create({
        data: { restaurantId },
      });
    }
    return settings;
  }

  async updateOverheadSettings(restaurantId: string, dto: any) {
    // Ensure exists
    await this.getOverheadSettings(restaurantId);
    return this.prisma.overheadSettings.update({
      where: { restaurantId },
      data: dto as any,
    });
  }

  // ==================== PROFIT CALCULATOR ====================

  async calculateProfit(
    restaurantId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 1. Revenue (from Orders)
    const revenueResult = await this.prisma.order.aggregate({
      where: {
        restaurantId,
        status: "COMPLETED",
        createdAt: { gte: start, lte: end },
      },
      _sum: {
        total: true,
        subtotal: true,
      },
    });
    const revenue = Number(revenueResult._sum.total || 0);

    // 2. Food Cost (Simplified for now - typically inventory usage)
    // We can use Wastage + Stock Usage if tracked, else estimated via target
    const settings = await this.getOverheadSettings(restaurantId);
    // Real tracking would require StockMovements of type 'USAGE'
    // Let's see if we can query StockMovements
    const stockUsage = await this.prisma.stockMovement.aggregate({
      where: {
        // How to link to restaurant? via InventoryItem
        inventoryItem: { restaurantId },
        type: "USAGE",
        createdAt: { gte: start, lte: end },
      },
      _sum: { totalCost: true }, // Assuming we tracked cost
    });
    // Also include wastage
    const wastage = await this.prisma.wastageRecord.aggregate({
      where: {
        restaurantId,
        wastedAt: { gte: start, lte: end },
      },
      _sum: { totalCost: true },
    });

    const realFoodCost =
      Math.abs(Number(stockUsage._sum.totalCost || 0)) +
      Number(wastage._sum.totalCost || 0);
    // If real cost is 0 (not tracking), use estimated
    const foodCost =
      realFoodCost > 0
        ? realFoodCost
        : revenue * (Number(settings.targetFoodCostPercentage) / 100);

    // 3. Labor Cost
    const laborEntries = await this.prisma.laborEntry.findMany({
      where: {
        restaurantId,
        payPeriodStart: { gte: start },
        payPeriodEnd: { lte: end },
      },
    });
    const laborCost = laborEntries.reduce(
      (sum, e) => sum + Number(e.totalCost),
      0,
    );

    // 4. Overhead Cost
    const months =
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44); // Approx months
    const monthlyFixed =
      Number(settings.monthlyRent) +
      Number(settings.monthlyUtilities) +
      Number(settings.monthlyInsurance) +
      Number(settings.monthlyLicenses) +
      Number(settings.monthlyMarketing) +
      Number(settings.monthlyMaintenance) +
      Number(settings.monthlySupplies) +
      Number(settings.monthlyOther);
    const overheadCost = monthlyFixed * Math.max(months, 0.03); // At least 1 day worth?

    // 5. Other Costs (Cost Entries)
    const otherCostsResult = await this.prisma.costEntry.aggregate({
      where: {
        restaurantId,
        date: { gte: start, lte: end },
        status: "PAID",
      },
      _sum: { amount: true },
    });
    const otherCosts = Number(otherCostsResult._sum.amount || 0);

    const totalCosts = foodCost + laborCost + overheadCost + otherCosts;
    const netProfit = revenue - totalCosts;

    return {
      revenue,
      costs: {
        foodCost,
        laborCost,
        overheadCost,
        otherCosts,
        totalCosts,
      },
      profit: {
        grossProfit: revenue - foodCost,
        netProfit,
        netProfitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
      },
      targets: {
        foodCostTarget: Number(settings.targetFoodCostPercentage),
        laborCostTarget: Number(settings.targetLaborCostPercentage),
        profitMarginTarget: Number(settings.targetProfitMargin),
      },
    };
  }

  async seedDefaultCategories(restaurantId: string) {
    const defaults = [
      { name: "Rent", type: CostCategoryType.RENT },
      { name: "Utilities", type: CostCategoryType.UTILITIES },
      { name: "Marketing", type: CostCategoryType.MARKETING },
      { name: "Supplies", type: CostCategoryType.SUPPLIES },
      { name: "Insurance", type: CostCategoryType.INSURANCE },
      { name: "Maintenance", type: CostCategoryType.MAINTENANCE },
      { name: "Other", type: CostCategoryType.OTHER },
    ];

    for (const cat of defaults) {
      const exists = await this.prisma.costCategory.findFirst({
        where: { restaurantId, name: cat.name },
      });
      if (!exists) {
        await this.prisma.costCategory.create({
          data: { ...cat, restaurantId },
        });
      }
    }
  }
}
