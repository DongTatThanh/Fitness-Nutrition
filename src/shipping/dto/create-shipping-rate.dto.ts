import { IsNotEmpty, IsOptional, IsInt, IsString, IsNumber, Min, MaxLength } from 'class-validator';

export class CreateShippingRateDto {
  @IsNotEmpty({ message: 'Carrier ID không được để trống' })
  @IsInt({ message: 'Carrier ID phải là số nguyên' })
  carrier_id: number;

  @IsNotEmpty({ message: 'Zone ID không được để trống' })
  @IsInt({ message: 'Zone ID phải là số nguyên' })
  zone_id: number;

  @IsNotEmpty({ message: 'Tên bảng giá không được để trống' })
  @IsString({ message: 'Tên bảng giá phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Tên bảng giá không được quá 100 ký tự' })
  name: string;

  @IsOptional()
  @IsNumber({}, { message: 'Trọng lượng tối thiểu phải là số' })
  @Min(0, { message: 'Trọng lượng tối thiểu phải lớn hơn hoặc bằng 0' })
  min_weight?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Trọng lượng tối đa phải là số' })
  @Min(0, { message: 'Trọng lượng tối đa phải lớn hơn hoặc bằng 0' })
  max_weight?: number | null;

  @IsNotEmpty({ message: 'Phí cơ bản không được để trống' })
  @IsNumber({}, { message: 'Phí cơ bản phải là số' })
  @Min(0, { message: 'Phí cơ bản phải lớn hơn hoặc bằng 0' })
  base_fee: number;

  @IsOptional()
  @IsNumber({}, { message: 'Phí mỗi kg phải là số' })
  @Min(0, { message: 'Phí mỗi kg phải lớn hơn hoặc bằng 0' })
  fee_per_kg?: number;

  @IsOptional()
  @IsInt({ message: 'Số ngày ước tính phải là số nguyên' })
  @Min(1, { message: 'Số ngày ước tính phải lớn hơn 0' })
  estimated_days?: number | null;

  @IsOptional()
  @IsInt({ message: 'Độ ưu tiên phải là số nguyên' })
  priority?: number;
}

