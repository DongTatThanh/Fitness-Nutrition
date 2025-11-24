import { IsNotEmpty, IsOptional, IsInt, IsString, IsNumber, Min, MaxLength } from 'class-validator';

export class CalculateShippingFeeDto {
  @IsNotEmpty({ message: 'Địa chỉ giao hàng không được để trống' })
  @IsString({ message: 'Địa chỉ giao hàng phải là chuỗi ký tự' })
  address: string;

  @IsOptional()
  @IsString({ message: 'Thành phố phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Thành phố không được quá 100 ký tự' })
  city?: string;

  @IsOptional()
  @IsString({ message: 'Quận/huyện phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Quận/huyện không được quá 100 ký tự' })
  district?: string;

  @IsNotEmpty({ message: 'Trọng lượng không được để trống' })
  @IsNumber({}, { message: 'Trọng lượng phải là số' })
  @Min(0, { message: 'Trọng lượng phải lớn hơn hoặc bằng 0' })
  weight: number; // kg

  @IsOptional()
  @IsInt({ message: 'Carrier ID phải là số nguyên' })
  carrier_id?: number; // Nếu không có sẽ tính cho tất cả carriers
}

