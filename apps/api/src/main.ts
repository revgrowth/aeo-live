// Load environment variables FIRST before any other imports
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);
    const port = configService.get<number>('API_PORT', 3001);
    const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:3000');

    // Security headers
    app.use(helmet());

    // CORS configuration
    app.enableCors({
        origin: corsOrigins.split(',').map((origin) => origin.trim()),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // Strip properties not in DTO
            forbidNonWhitelisted: true, // Throw error for unknown properties
            transform: true, // Transform payloads to DTO instances
            transformOptions: {
                enableImplicitConversion: true,
            },
        })
    );

    // Global prefix
    app.setGlobalPrefix('api/v1');

    await app.listen(port);
    console.log(`🚀 AEO.LIVE API running on http://localhost:${port}`);
}

bootstrap();
