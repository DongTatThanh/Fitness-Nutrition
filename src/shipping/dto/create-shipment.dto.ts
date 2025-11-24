import { IsNotEmpty, IsOptional, IsInt, IsString, IsNumber, Min, MaxLength } from 'class-validator';

export class CreateShipmentDto {
  @IsNotEmpty({ message: 'Order ID không được để trống' })
  @IsInt({ message: 'Order ID phải là số nguyên' })
  order_id: number;

  @IsNotEmpty({ message: 'Carrier ID không được để trống' })
  @IsInt({ message: 'Carrier ID phải là số nguyên' })
  carrier_id: number;

  @IsOptional()
  @IsString({ message: 'Tracking number phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Tracking number không được quá 100 ký tự' })
  tracking_number?: string; // Nếu không có sẽ tự động tạo

  @IsOptional()
  @IsNumber({}, { message: 'Trọng lượng phải là số' })
  @Min(0, { message: 'Trọng lượng phải lớn hơn hoặc bằng 0' })
  weight?: number | null;

  @IsOptional()
  dimensions?: { length: number; width: number; height: number } | null;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  notes?: string | null;
}

