import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { WastageService } from './wastage.service';
import { CreateWastageDto } from './dto/create-wastage.dto';
import { WastageFiltersDto } from './dto/wastage-filters.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Wastage')
@Controller('wastage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WastageController {
    constructor(private readonly service: WastageService) { }

    @Post()
    @ApiOperation({ summary: 'Log wastage' })
    async create(
        @Body() dto: CreateWastageDto,
        @CurrentUser('restaurantId') restaurantId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.service.create(dto, restaurantId, userId);
    }

    @Get()
    @ApiOperation({ summary: 'Get wastage logs' })
    async findAll(
        @Query() filters: WastageFiltersDto,
        @CurrentUser('restaurantId') restaurantId: string,
    ) {
        return this.service.findAll(restaurantId, filters);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get wastage statistics' })
    async getStats(@CurrentUser('restaurantId') restaurantId: string) {
        return this.service.getStats(restaurantId);
    }

    @Get('report')
    @ApiOperation({ summary: 'Get wastage report' })
    async getReport(
        @Query('period') period: 'week' | 'month',
        @CurrentUser('restaurantId') restaurantId: string,
    ) {
        return this.service.getReport(restaurantId, period);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get wastage log by ID' })
    async findById(
        @Param('id') id: string,
        @CurrentUser('restaurantId') restaurantId: string,
    ) {
        return this.service.findById(id, restaurantId);
    }
}
