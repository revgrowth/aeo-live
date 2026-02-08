import { Module, Global } from '@nestjs/common';
import { ErrorNotificationService } from './error-notification.service';

@Global()
@Module({
    providers: [ErrorNotificationService],
    exports: [ErrorNotificationService],
})
export class ErrorNotificationModule { }
