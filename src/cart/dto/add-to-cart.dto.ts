import { IsInt, IsPositive, IsOptional, Min } from 'class-validator';

export class AddToCartDto {
  @IsInt()
  @IsPositive()
  product_id: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  variant_id?: number;

  @IsInt()
  @Min(1)
  quantity: number;
}