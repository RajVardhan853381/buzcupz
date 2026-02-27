import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
    HealthCheckService,
    HealthCheck,
    MemoryHealthIndicator,
    DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from './indicators/prisma.health';
import { SkipThrottle } from '@/common/decorators/throttle.decorator';

@ApiTags('Health')
@Controller('health')
@SkipThrottle()
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private prisma: PrismaHealthIndicator,
        private memory: MemoryHealthIndicator,
        private disk: DiskHealthIndicator,
    ) { }

    @Get()
    @HealthCheck()
    @ApiOperation({ summary: 'Health check endpoint' })
    @ApiResponse({ status: 200, description: 'Service is healthy' })
    @ApiResponse({ status: 503, description: 'Service is unhealthy' })
    check() {
        return this.health.check([
            // Database check
            () => this.prisma.isHealthy('database'),

            // Memory check - max 500MB heap
            () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),

            // Disk check - max 90% usage
            // Note: Disk check might fail in some container environments if path doesn't exist
            // Disabling by default or using a safe path.
            // () => this.disk.checkStorage('storage', { 
            //   path: '/', 
            //   thresholdPercent: 0.9 
            // }),
        ]);
    }

    @Get('live')
    @ApiOperation({ summary: 'Liveness probe' })
    @ApiResponse({ status: 200, description: 'Service is alive' })
    liveness() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }

    @Get('ready')
    @HealthCheck()
    @ApiOperation({ summary: 'Readiness probe' })
    @ApiResponse({ status: 200, description: 'Service is ready' })
    @ApiResponse({ status: 503, description: 'Service is not ready' })
    readiness() {
        return this.health.check([
            () => this.prisma.isHealthy('database'),
        ]);
    }
}
