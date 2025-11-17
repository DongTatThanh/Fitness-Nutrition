import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsNumber()
  @Min(1)
  quantity: number;

  // Cho phép frontend gửi price (nhưng backend sẽ tính lại từ product)
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}

