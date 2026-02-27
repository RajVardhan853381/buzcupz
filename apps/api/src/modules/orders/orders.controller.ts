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
} from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { OrderFiltersDto } from "./dto/order-filters.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Orders")
@ApiBearerAuth()
@Controller("orders")
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles("ADMIN", "MANAGER", "STAFF")
  @ApiOperation({ summary: "Create a new order" })
  @ApiResponse({ status: 201, description: "Order created successfully" })
  async create(
    @Body() dto: CreateOrderDto,
    @CurrentUser("id") userId: string,
    @CurrentUser("restaurantId") restaurantId: string,
  ) {
    return this.ordersService.create(dto, userId, restaurantId);
  }

  @Get()
  @ApiOperation({ summary: "Get all orders with filters" })
  async findAll(
    @Query() filters: OrderFiltersDto,
    @CurrentUser("restaurantId") restaurantId: string,
  ) {
    return this.ordersService.findAll(restaurantId, filters);
  }

  @Get("kitchen")
  @Roles("ADMIN", "MANAGER", "KITCHEN", "STAFF")
  @ApiOperation({ summary: "Get kitchen order queue" })
  async getKitchenQueue(@CurrentUser("restaurantId") restaurantId: string) {
    return this.ordersService.getKitchenOrders(restaurantId);
  }

  @Patch(":id/items/:itemId/status")
  @Roles("ADMIN", "MANAGER", "STAFF", "KITCHEN")
  @ApiOperation({ summary: "Update order item status" })
  async updateItemStatus(
    @Param("id") orderId: string,
    @Param("itemId") itemId: string,
    @Body("status") status: string,
    @CurrentUser("restaurantId") restaurantId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.ordersService.updateItemStatus(
      orderId,
      itemId,
      status,
      restaurantId,
      userId,
    );
  }

  @Patch(":id/status")
  @Roles("ADMIN", "MANAGER", "STAFF", "KITCHEN")
  @ApiOperation({ summary: "Update order status" })
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser("restaurantId") restaurantId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.ordersService.updateStatus(id, dto, restaurantId, userId);
  }

  @Delete(":id")
  @Roles("ADMIN", "MANAGER")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel order" })
  async cancel(
    @Param("id") id: string,
    @Body("reason") reason: string,
    @CurrentUser("restaurantId") restaurantId: string,
  ) {
    return this.ordersService.cancel(
      id,
      reason || "No reason provided",
      restaurantId,
    );
  }
}
