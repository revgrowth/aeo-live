import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '@/common/database/prisma.service';

@Controller('health')
@SkipThrottle()
export class HealthController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    async check() {
        const checks = {
            api: 'ok',
            database: 'unknown',
            timestamp: new Date().toISOString(),
        };

        try {
            await this.prisma.$queryRaw`SELECT 1`;
            checks.database = 'ok';
        } catch {
            checks.database = 'error';
        }

        return {
            success: true,
            data: checks,
        };
    }

    @Get('ready')
    async ready() {
        // Check if all services are ready
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return { ready: true };
        } catch {
            return { ready: false };
        }
    }

    @Get('live')
    live() {
        // Simple liveness check
        return { live: true };
    }
}
