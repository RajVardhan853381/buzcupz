import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AdminGuard } from "../guards/admin.guard";
import { AdminRoles } from "../decorators/admin-roles.decorator";
import { CurrentAdmin } from "../decorators/current-admin.decorator";
import { AdminDashboardService } from "../services/admin-dashboard.service";
import { AdminRole } from "@prisma/client";

@ApiTags("Admin")
@ApiBearerAuth()
@Controller("admin")
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  // ============ DASHBOARD ============

  @Get("dashboard")
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.VIEWER)
  @ApiOperation({ summary: "Get admin dashboard metrics" })
  async getDashboard() {
    return this.dashboardService.getDashboardMetrics();
  }

  // ============ RESTAURANTS ============

  @Get("restaurants")
  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.SUPPORT,
    AdminRole.VIEWER,
  )
  @ApiOperation({ summary: "List all restaurants" })
  async listRestaurants(
    @Query("search") search?: string,
    @Query("plan") plan?: string,
    @Query("status") status?: "active" | "inactive" | "trial",
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.dashboardService.getRestaurantsList({
      search,
      plan,
      status,
      page,
      limit,
    });
  }

  @Get("restaurants/:id")
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.SUPPORT)
  @ApiOperation({ summary: "Get restaurant details" })
  async getRestaurant(@Param("id") id: string) {
    return this.dashboardService.getRestaurantDetails(id);
  }

  @Post("restaurants/:id/suspend")
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: "Suspend a restaurant" })
  async suspendRestaurant(
    @Param("id") id: string,
    @Body("reason") reason: string,
    @CurrentAdmin() admin: any,
  ) {
    await this.dashboardService.suspendRestaurant(id, reason, admin.id);
    return { success: true };
  }

  @Post("restaurants/:id/reactivate")
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: "Reactivate a restaurant" })
  async reactivateRestaurant(
    @Param("id") id: string,
    @CurrentAdmin() admin: any,
  ) {
    await this.dashboardService.reactivateRestaurant(id, admin.id);
    return { success: true };
  }
}
