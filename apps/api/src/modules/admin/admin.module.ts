import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminErrorsController } from './admin-errors.controller';
import { UserManagementController } from './user-management.controller';
import { BootstrapController } from './bootstrap.controller';
import { PrismaService } from '../../common/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ErrorNotificationService } from '../../common/errors/error-notification.service';
import { EmailService } from '../../common/email/email.service';
import { ClaimCodesService } from '../claim-codes/claim-codes.service';
import { PdfService } from '../analysis/pdf.service';

@Module({
    controllers: [AdminDashboardController, AdminErrorsController, UserManagementController, BootstrapController],
    providers: [AdminDashboardService, PrismaService, ConfigService, ErrorNotificationService, EmailService, ClaimCodesService, PdfService],
    exports: [AdminDashboardService],
})
export class AdminModule { }
