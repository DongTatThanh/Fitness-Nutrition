import { IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';

export class ReceiveItemDto {
  @IsNotEmpty({ message: 'Số lượng nhận không được để trống' })
  @IsInt({ message: 'Số lượng nhận phải là số nguyên' })
  @Min(0, { message: 'Số lượng nhận phải lớn hơn hoặc bằng 0' })
  quantity_received: number;
}

