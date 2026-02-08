import { Module, Global } from '@nestjs/common';
import { ErrorLoggingService, errorLogger } from './error-logging.service';
import { ErrorLoggingController } from './error-logging.controller';

@Global()
@Module({
    controllers: [ErrorLoggingController],
    providers: [
        {
            provide: ErrorLoggingService,
            useValue: errorLogger,
        },
    ],
    exports: [ErrorLoggingService],
})
export class ErrorLoggingModule { }
