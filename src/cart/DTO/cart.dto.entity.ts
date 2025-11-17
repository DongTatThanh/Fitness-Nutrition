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

  // Cho phép frontend gửi price (nhưng backend sẽ tính lại từ product)
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}