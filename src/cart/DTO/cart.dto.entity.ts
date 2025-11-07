``
import { IsNumber, IsPositive, IsOptional, Min } from 'class-validator';

export class AddToCartDto {
  @IsNumber()
  @IsPositive()
  product_id: number;

  @IsOptional()
  @IsNumber()
  variant?: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}