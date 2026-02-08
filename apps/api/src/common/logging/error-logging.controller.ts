import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { errorLogger, ErrorLogEntry, BugReport } from './error-logging.service';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class SubmitBugReportDto {
    @IsString()
    userDescription: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsString()
    url: string;

    @IsString()
    userAgent: string;

    @IsOptional()
    @IsString()
    errorMessage?: string;

    @IsOptional()
    @IsString()
    errorStack?: string;

    @IsOptional()
    @IsString()
    errorId?: string;

    @IsOptional()
    metadata?: Record<string, unknown>;
}

@Controller('errors')
export class ErrorLoggingController {
    /**
     * Submit a bug report from the frontend
     */
    @Post('report')
    @HttpCode(HttpStatus.CREATED)
    submitBugReport(@Body() dto: SubmitBugReportDto): { reportId: string; message: string } {
        const reportId = errorLogger.logBugReport({
            userDescription: dto.userDescription,
            email: dto.email,
            url: dto.url,
            userAgent: dto.userAgent,
            errorMessage: dto.errorMessage,
            errorStack: dto.errorStack,
            errorId: dto.errorId,
            metadata: dto.metadata,
        });

        return {
            reportId,
            message: 'Bug report submitted successfully. Thank you for helping us improve!',
        };
    }

    /**
     * Get recent errors (for admin/debugging)
     */
    @Get('recent')
    getRecentErrors(): { errors: ErrorLogEntry[] } {
        return {
            errors: errorLogger.getRecentErrors(20),
        };
    }

    /**
     * Get recent bug reports (for admin/debugging)
     */
    @Get('reports')
    getRecentBugReports(): { reports: BugReport[] } {
        return {
            reports: errorLogger.getRecentBugReports(20),
        };
    }
}
