import { IsString, MaxLength } from 'class-validator';

export class RedeemClaimCodeDto {
    @IsString()
    @MaxLength(50)
    code: string;
}
