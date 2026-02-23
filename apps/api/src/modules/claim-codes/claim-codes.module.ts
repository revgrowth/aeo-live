import { Module } from '@nestjs/common';
import { ClaimCodesService } from './claim-codes.service';
import { ClaimCodesController } from './claim-codes.controller';

@Module({
    controllers: [ClaimCodesController],
    providers: [ClaimCodesService],
    exports: [ClaimCodesService],
})
export class ClaimCodesModule { }
