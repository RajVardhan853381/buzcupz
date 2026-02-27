import {
  Controller,
  Get,
  Post,
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
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { InventoryService } from "./inventory.service";
import { CreateInventoryItemDto } from "./dto/create-inventory-item.dto";
import { UpdateInventoryItemDto } from "./dto/update-inventory-item.dto";
import { StockAdjustmentDto } from "./dto/stock-adjustment.dto";
import { BulkAdjustmentDto } from "./dto/bulk-adjustment.dto";
import { InventoryFiltersDto } from "./dto/inventory-filters.dto";
import { MovementFiltersDto } from "./dto/movement-filters.dto";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Inventory")
@Controller("inventory")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  // ============================================
  // ITEMS
  // ============================================

  @Get("items")
  @ApiOperation({ summary: "Get all inventory items with filters" })
  async getItems(
    @Query() filters: InventoryFiltersDto,
    @CurrentUser("restaurantId") restaurantId: string,
  ) {
    return this.service.findAllItems(restaurantId, filters);
  }

  @Get("items/:id")
  @ApiOperation({ summary: "Get inventory item details" })
  @ApiParam({ name: "id", description: "Item ID" })
  async getItem(
    @Param("id") id: string,
    @CurrentUser("restaurantId") restaurantId: string,
  ) {
    return this.service.findItemById(id, restaurantId);
  }

  @Post("items")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "MANAGER")
  @ApiOperation({ summary: "Create new inventory item" })
  async createItem(
    @Body() dto: CreateInventoryItemDto,
    @CurrentUser("restaurantId") restaurantId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.service.createItem(dto, restaurantId, userId);
  }

  @Patch("items/:id")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "MANAGER")
  @ApiOperation({ summary: "Update inventory item" })
  async updateItem(
    @Param("id") id: string,
    @Body() dto: UpdateInventoryItemDto,
    @CurrentUser("restaurantId") restaurantId: string,
  ) {
    return this.service.updateItem(id, dto, restaurantId);
  }

  @Delete("items/:id")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "MANAGER")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Deactivate inventory item" })
  async deleteItem(
    @Param("id") id: string,
    @CurrentUser("restaurantId") restaurantId: string,
  ) {
    return this.service.deleteItem(id, restaurantId);
  }

  // ============================================
  // STOCK ADJUSTMENTS
  // ============================================

  @Post("items/:id/adjust")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "MANAGER", "STAFF")
  @ApiOperation({ summary: "Adjust stock for an item" })
  async adjustStock(
    @Param("id") id: string,
    @Body() dto: StockAdjustmentDto,
    @CurrentUser("restaurantId") restaurantId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.service.adjustStock(id, dto, restaurantId, userId);
  }

  @Post("bulk-adjust")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "MANAGER")
  @ApiOperation({ summary: "Bulk stock adjustment" })
  async bulkAdjust(
    @Body() dto: BulkAdjustmentDto,
    @CurrentUser("restaurantId") restaurantId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.service.bulkAdjust(dto, restaurantId, userId);
  }

  // ============================================
  // MOVEMENTS
  // ============================================

  @Get("movements")
  @ApiOperation({ summary: "Get stock movement history" })
  async getMovements(
    @Query() filters: MovementFiltersDto,
    @CurrentUser("restaurantId") restaurantId: string,
  ) {
    return this.service.getMovements(restaurantId, filters);
  }

  // ============================================
  // SUPPLIERS
  // ============================================

  @Get("suppliers")
  @ApiOperation({ summary: "Get all suppliers" })
  async getSuppliers(@CurrentUser("restaurantId") restaurantId: string) {
    return this.service.getSuppliers(restaurantId);
  }

  @Post("suppliers")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "MANAGER")
  @ApiOperation({ summary: "Create supplier" })
  async createSupplier(
    @Body() dto: CreateSupplierDto,
    @CurrentUser("restaurantId") restaurantId: string,
  ) {
    return this.service.createSupplier(dto, restaurantId);
  }

  @Patch("suppliers/:id")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "MANAGER")
  @ApiOperation({ summary: "Update supplier" })
  async updateSupplier(
    @Param("id") id: string,
    @Body() dto: Partial<CreateSupplierDto>,
    @CurrentUser("restaurantId") restaurantId: string,
  ) {
    return this.service.updateSupplier(id, dto, restaurantId);
  }

  // ============================================
  // ALERTS
  // ============================================

  @Get("alerts")
  @ApiOperation({ summary: "Get all alerts" })
  @ApiQuery({ name: "includeResolved", required: false, type: Boolean })
  async getAlerts(
    @Query("includeResolved") includeResolved: boolean,
    @CurrentUser("restaurantId") restaurantId: string,
  ) {
    return this.service.getAlerts(restaurantId, includeResolved);
  }

  @Patch("alerts/:id/resolve")
  @ApiOperation({ summary: "Resolve an alert" })
  async resolveAlert(
    @Param("id") id: string,
    @CurrentUser("restaurantId") restaurantId: string,
  ) {
    return this.service.resolveAlert(id, restaurantId);
  }

  // ============================================
  // ANALYTICS & REPORTS
  // ============================================

  @Get("stats")
  @ApiOperation({ summary: "Get inventory statistics" })
  async getStats(@CurrentUser("restaurantId") restaurantId: string) {
    return this.service.getStats(restaurantId);
  }

  @Get("low-stock")
  @ApiOperation({ summary: "Get low stock items" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getLowStock(
    @Query("limit") limit: number,
    @CurrentUser("restaurantId") restaurantId: string,
  ) {
    return this.service.getLowStockItems(restaurantId, limit || 20);
  }
}
