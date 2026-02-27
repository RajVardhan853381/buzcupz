import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { CostManagementService } from "./cost-management.service";
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

import { CostStatus, UserRole } from "@prisma/client";

@Controller("restaurants/:restaurantId/costs")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CostManagementController {
  constructor(private readonly costService: CostManagementService) {}

  // ==================== CATEGORIES ====================

  @Get("categories")
  async getCategories(@Param("restaurantId") restaurantId: string) {
    return this.costService.findAllCategories(restaurantId);
  }

  @Post("categories")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createCategory(
    @Param("restaurantId") restaurantId: string,
    @Body() dto: CreateCostCategoryDto,
  ) {
    return this.costService.createCategory(restaurantId, dto);
  }

  @Get("categories/:id")
  async getCategory(
    @Param("restaurantId") restaurantId: string,
    @Param("id") id: string,
  ) {
    return this.costService.findCategoryById(restaurantId, id);
  }

  @Put("categories/:id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateCategory(
    @Param("restaurantId") restaurantId: string,
    @Param("id") id: string,
    @Body() dto: UpdateCostCategoryDto,
  ) {
    return this.costService.updateCategory(restaurantId, id, dto);
  }

  @Delete("categories/:id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCategory(
    @Param("restaurantId") restaurantId: string,
    @Param("id") id: string,
  ) {
    await this.costService.deleteCategory(restaurantId, id);
  }

  @Post("categories/seed")
  @Roles(UserRole.ADMIN)
  async seedCategories(@Param("restaurantId") restaurantId: string) {
    await this.costService.seedDefaultCategories(restaurantId);
    return { message: "Default categories seeded successfully" };
  }

  // ==================== COST ENTRIES ====================

  @Get("entries")
  async getCostEntries(
    @Param("restaurantId") restaurantId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("categoryId") categoryId?: string,
    @Query("status") status?: CostStatus,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.costService.findAllCostEntries(restaurantId, {
      startDate,
      endDate,
      categoryId,
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
  }

  @Post("entries")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createCostEntry(
    @Param("restaurantId") restaurantId: string,
    @Body() dto: CreateCostEntryDto,
    @Request() req: any,
  ) {
    return this.costService.createCostEntry(restaurantId, dto, req.user?.id);
  }

  @Get("entries/:id")
  async getCostEntry(
    @Param("restaurantId") restaurantId: string,
    @Param("id") id: string,
  ) {
    return this.costService.findCostEntryById(restaurantId, id);
  }

  @Put("entries/:id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateCostEntry(
    @Param("restaurantId") restaurantId: string,
    @Param("id") id: string,
    @Body() dto: UpdateCostEntryDto,
  ) {
    return this.costService.updateCostEntry(restaurantId, id, dto);
  }

  @Delete("entries/:id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCostEntry(
    @Param("restaurantId") restaurantId: string,
    @Param("id") id: string,
    @Query("deleteRecurring") deleteRecurring?: string,
  ) {
    await this.costService.deleteCostEntry(
      restaurantId,
      id,
      deleteRecurring === "true",
    );
  }

  // ==================== EMPLOYEES ====================

  @Get("employees")
  async getEmployees(
    @Param("restaurantId") restaurantId: string,
    @Query("includeInactive") includeInactive?: string,
  ) {
    return this.costService.findAllEmployees(
      restaurantId,
      includeInactive === "true",
    );
  }

  @Post("employees")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createEmployee(
    @Param("restaurantId") restaurantId: string,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.costService.createEmployee(restaurantId, dto);
  }

  @Get("employees/:id")
  async getEmployee(
    @Param("restaurantId") restaurantId: string,
    @Param("id") id: string,
  ) {
    return this.costService.findEmployeeById(restaurantId, id);
  }

  @Put("employees/:id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateEmployee(
    @Param("restaurantId") restaurantId: string,
    @Param("id") id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.costService.updateEmployee(restaurantId, id, dto);
  }

  @Delete("employees/:id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEmployee(
    @Param("restaurantId") restaurantId: string,
    @Param("id") id: string,
  ) {
    await this.costService.deleteEmployee(restaurantId, id);
  }

  // ==================== LABOR ENTRIES ====================

  @Get("labor")
  async getLaborEntries(
    @Param("restaurantId") restaurantId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("employeeId") employeeId?: string,
    @Query("isPaid") isPaid?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.costService.findAllLaborEntries(restaurantId, {
      startDate,
      endDate,
      employeeId,
      isPaid,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
  }

  @Post("labor")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createLaborEntry(
    @Param("restaurantId") restaurantId: string,
    @Body() dto: CreateLaborEntryDto,
  ) {
    return this.costService.createLaborEntry(restaurantId, dto);
  }

  @Get("labor/:id")
  async getLaborEntry(
    @Param("restaurantId") restaurantId: string,
    @Param("id") id: string,
  ) {
    return this.costService.findLaborEntryById(restaurantId, id);
  }

  @Put("labor/:id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateLaborEntry(
    @Param("restaurantId") restaurantId: string,
    @Param("id") id: string,
    @Body() dto: UpdateLaborEntryDto,
  ) {
    return this.costService.updateLaborEntry(restaurantId, id, dto);
  }

  @Delete("labor/:id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLaborEntry(
    @Param("restaurantId") restaurantId: string,
    @Param("id") id: string,
  ) {
    await this.costService.deleteLaborEntry(restaurantId, id);
  }

  // ==================== OVERHEAD SETTINGS ====================

  @Get("overhead")
  async getOverheadSettings(@Param("restaurantId") restaurantId: string) {
    return this.costService.getOverheadSettings(restaurantId);
  }

  @Put("overhead")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateOverheadSettings(
    @Param("restaurantId") restaurantId: string,
    @Body() dto: any,
  ) {
    return this.costService.updateOverheadSettings(restaurantId, dto);
  }

  // ==================== PROFIT CALCULATOR ====================

  @Get("profit")
  async calculateProfit(
    @Param("restaurantId") restaurantId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    if (!startDate || !endDate) {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      endDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      ).toISOString();
    }
    return this.costService.calculateProfit(restaurantId, startDate, endDate);
  }
}
