import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AuditsModule } from './modules/audits/audits.module';
import { BillingModule } from './modules/billing/billing.module';
import { HealthModule } from './modules/health/health.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { AdminModule } from './modules/admin/admin.module';
import { ErrorLoggingModule } from './common/logging/error-logging.module';
import { DatabaseModule } from './common/database/database.module';
import { EmailModule } from './common/email/email.module';
import { ErrorNotificationModule } from './common/errors/error-notification.module';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '../../.env',
        }),

        // Rate limiting
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                throttlers: [
                    {
                        ttl: config.get<number>('RATE_LIMIT_TTL', 60) * 1000, // Convert to ms
                        limit: config.get<number>('RATE_LIMIT_MAX', 100),
                    },
                ],
            }),
        }),

        // Database
        DatabaseModule,

        // Feature modules
        AuthModule,
        UsersModule,
        OrganizationsModule,
        ProjectsModule,
        AuditsModule,
        BillingModule,
        HealthModule,
        AnalysisModule,
        AdminModule,
        ErrorLoggingModule,
        EmailModule,
        ErrorNotificationModule,
    ],
    providers: [
        // Apply rate limiting globally
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }
