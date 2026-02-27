import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerCounterService } from './customer-counter.service';
import { RecordVisitDto, UpdateVisitDto, CounterFiltersDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Customer Counter')
@Controller('customer-counter')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomerCounterController {
    constructor(private readonly service: CustomerCounterService) { }

    @Get('live')
    @ApiOperation({ summary: 'Get current live count' })
    async getLiveCount(@CurrentUser('restaurantId') restaurantId: string) {
        return this.service.getLiveCount(restaurantId);
    }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get full dashboard data' })
    async getDashboard(@CurrentUser('restaurantId') restaurantId: string) {
        return this.service.getDashboard(restaurantId);
    }

    @Post('increment')
    @ApiOperation({ summary: 'Quick increment counter by 1' })
    async quickIncrement(@CurrentUser('restaurantId') restaurantId: string) {
        return this.service.quickIncrement(restaurantId);
    }

    @Post('record')
    @ApiOperation({ summary: 'Record a new visit with details' })
    async recordVisit(
        @Body() dto: RecordVisitDto,
        @CurrentUser('restaurantId') restaurantId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.service.recordVisit(dto, restaurantId, userId);
    }

    @Post('decrement')
    @ApiOperation({ summary: 'Decrement count (correction)' })
    async decrement(
        @Body('count') count: number = 1,
        @CurrentUser('restaurantId') restaurantId: string,
    ) {
        return this.service.decrementToday(restaurantId, count);
    }

    @Get('today')
    @ApiOperation({ summary: 'Get today\'s stats' })
    async getToday(@CurrentUser('restaurantId') restaurantId: string) {
        const today = new Date().toISOString().split('T')[0];
        return this.service.getDailyStats(restaurantId, today);
    }

    @Get('hourly')
    @ApiOperation({ summary: 'Get hourly breakdown' })
    async getHourlyBreakdown(
        @Query('date') date: string,
        @CurrentUser('restaurantId') restaurantId: string,
    ) {
        return this.service.getHourlyBreakdown(restaurantId, date || new Date().toISOString().split('T')[0]);
    }

    @Get('daily/:date')
    @ApiOperation({ summary: 'Get stats for a specific date' })
    async getDailyStats(
        @Param('date') date: string,
        @CurrentUser('restaurantId') restaurantId: string,
    ) {
        return this.service.getDailyStats(restaurantId, date);
    }

    @Get('peak-analysis')
    @ApiOperation({ summary: 'Get peak hours analysis' })
    async getPeakAnalysis(@CurrentUser('restaurantId') restaurantId: string) {
        return this.service.getPeakAnalysis(restaurantId);
    }

    @Get('trends')
    @ApiOperation({ summary: 'Get trend comparisons' })
    async getTrends(@CurrentUser('restaurantId') restaurantId: string) {
        return this.service.getTrends(restaurantId);
    }

    @Get('history')
    @ApiOperation({ summary: 'Get historical footfall data' })
    async getHistory(
        @Query() filters: CounterFiltersDto,
        @CurrentUser('restaurantId') restaurantId: string,
    ) {
        return this.service.getHistory(restaurantId, filters);
    }

    @Get('visits')
    @ApiOperation({ summary: 'Get recent visits' })
    async getRecentVisits(
        @Query('limit') limit: number = 20,
        @CurrentUser('restaurantId') restaurantId: string,
    ) {
        return this.service.getRecentVisits(restaurantId, limit);
    }

    @Patch('visits/:id')
    @ApiOperation({ summary: 'Update a visit' })
    async updateVisit(
        @Param('id') id: string,
        @Body() dto: UpdateVisitDto,
        @CurrentUser('restaurantId') restaurantId: string,
    ) {
        return this.service.updateVisit(id, dto, restaurantId);
    }
}
