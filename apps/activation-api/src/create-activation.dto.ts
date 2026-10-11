import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { SimulateFailure } from '@app/contracts';

export class CreateActivationDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsString()
  @IsNotEmpty()
  planId!: string;

  @IsOptional()
  @IsIn(['none', 'billing', 'provisioning'])
  simulateFailure?: SimulateFailure;

  @IsOptional()
  @IsString()
  channel?: string;
}