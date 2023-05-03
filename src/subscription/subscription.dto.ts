import { IsNumber } from 'class-validator';

export class SubscriptionDto {
  login: bigint;

  @IsNumber()
  source: number;


  r_login: bigint;

  @IsNumber()
  r_source: number;
}
