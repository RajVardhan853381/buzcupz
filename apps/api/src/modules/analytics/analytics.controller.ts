import { Controller, Get, Query, UseGuards, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsQueryDto } from "./dto/analytics-query.dto";
import { BestSellersQueryDto } from "./dto/best-sellers-query.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Analytics")
@Controller("analytics")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get("dashboard")
  @ApiOperation({ summary: "Get dashboard overview metrics with comparison" })
  async getDashboard(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser("restaurantId") restaurantId: string,
  ) {
    return this.service.getDashboard(restaurantId, query);
  }

  @Get("best-sellers")
  @ApiOperation({ summary: "Get best selling items with trends" })
  async getBestSellers(
    @Query() query: BestSellersQueryDto,
    @CurrentUser("restaurantId") restaurantId: string,
  ) {
    return this.service.getBestSellers(restaurantId, query);
  }

  @Get("worst-sellers")
  @ApiOperation({ summary: "Get worst selling items" })
  async getWorstSellers(
    @Query() query: BestSellersQueryDto,
    @CurrentUser("restaurantId") restaurantId: string,
  ) {
    return this.service.getWorstSellers(restaurantId, query);
  }

  @Get("categories")
  @ApiOperation({ summary: "Get category performance with trends" })
  async getCategoryPerformance(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser("restaurantId") restaurantId: string,
  ) {
    return this.service.getCategoryPerformance(restaurantId, query);
  }

  @Get("trends")
  @ApiOperation({ summary: "Get sales trends (daily data)" })
  async getSalesTrend(
    @Query("days") days: number = 30,
    @CurrentUser("restaurantId") restaurantId: string,
  ) {
    return this.service.getSalesTrend(restaurantId, days);
  }

  @Get("hourly-patterns")
  @ApiOperation({ summary: "Get hourly sales patterns" })
  async getHourlyPatterns(@CurrentUser("restaurantId") restaurantId: string) {
    return this.service.getHourlyPatterns(restaurantId);
  }
}
