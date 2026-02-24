import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class GenerateClaimCodeDto {
    @IsString()
    @MaxLength(255)
    domain: string;

    @IsUUID()
    @IsOptional()
    leadId?: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    customCode?: string;

    @IsUUID()
    @IsOptional()
    analysisRunId?: string;
}
