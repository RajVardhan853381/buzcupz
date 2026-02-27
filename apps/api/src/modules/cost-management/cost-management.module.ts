
import { Module } from '@nestjs/common';
import { CostManagementService } from './cost-management.service';
import { CostManagementController } from './cost-management.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
    controllers: [CostManagementController],
    providers: [CostManagementService, PrismaService],
    exports: [CostManagementService],
})
export class CostManagementModule { }
