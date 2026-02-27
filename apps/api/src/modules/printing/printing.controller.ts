
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { PrintingService } from './printing.service';
import { CreatePrinterDto, UpdatePrinterDto, CreatePrintJobDto } from './dto/create-printer.dto';
import { UserRole } from '@prisma/client';

@Controller('restaurants/:restaurantId/printing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrintingController {
    constructor(private readonly printingService: PrintingService) { }

    @Get('printers')
    async getPrinters(@Param('restaurantId') restaurantId: string) {
        return this.printingService.findAllPrinters(restaurantId);
    }

    @Post('printers')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async createPrinter(
        @Param('restaurantId') restaurantId: string,
        @Body() dto: CreatePrinterDto,
    ) {
        return this.printingService.createPrinter(restaurantId, dto);
    }

    @Put('printers/:id')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async updatePrinter(
        @Param('restaurantId') restaurantId: string,
        @Param('id') id: string,
        @Body() dto: UpdatePrinterDto,
    ) {
        return this.printingService.updatePrinter(restaurantId, id, dto);
    }

    @Delete('printers/:id')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @HttpCode(HttpStatus.NO_CONTENT)
    async deletePrinter(
        @Param('restaurantId') restaurantId: string,
        @Param('id') id: string,
    ) {
        await this.printingService.deletePrinter(restaurantId, id);
    }

    @Post('jobs')
    async createPrintJob(
        @Param('restaurantId') restaurantId: string,
        @Body() dto: CreatePrintJobDto,
    ) {
        return this.printingService.createPrintJob(restaurantId, dto);
    }

    @Post('jobs/order/:orderId')
    async printOrder(
        @Param('restaurantId') restaurantId: string,
        @Param('orderId') orderId: string,
        @Body('printerId') printerId?: string,
    ) {
        return this.printingService.printOrder(restaurantId, orderId, printerId);
    }
}
