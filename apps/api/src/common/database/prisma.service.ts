import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@aeo-live/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);
    private connected = false;

    constructor() {
        super({
            log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        });
    }

    async onModuleInit() {
        try {
            await this.$connect();
            this.connected = true;
            this.logger.log('Database connected successfully');
        } catch (error) {
            this.logger.warn('Database connection failed - API will run without DB');
            this.logger.warn('Some features may be unavailable');
            // Don't throw - allow API to start without DB for free analysis flow
        }
    }

    async onModuleDestroy() {
        if (this.connected) {
            await this.$disconnect();
        }
    }

    isConnected(): boolean {
        return this.connected;
    }
}
