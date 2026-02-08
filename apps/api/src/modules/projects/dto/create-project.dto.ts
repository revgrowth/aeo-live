import { IsString, IsOptional, IsArray, MaxLength, IsEnum } from 'class-validator';

export class CreateProjectDto {
    @IsString()
    @MaxLength(255)
    name: string;

    @IsString()
    @MaxLength(255)
    primaryDomain: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    competitors?: string[];

    @IsEnum(['MONTHLY', 'WEEKLY', 'TWICE_WEEKLY'])
    @IsOptional()
    monitoringFrequency?: 'MONTHLY' | 'WEEKLY' | 'TWICE_WEEKLY';
}
