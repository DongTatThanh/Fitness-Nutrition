import { IsOptional, IsString, IsEmail, MaxLength, IsInt } from 'class-validator';

export class UpdateShippingCarrierDto {
  @IsOptional()
  @IsString({ message: 'Tên đơn vị vận chuyển phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Tên đơn vị vận chuyển không được quá 100 ký tự' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Mã đơn vị vận chuyển phải là chuỗi ký tự' })
  @MaxLength(50, { message: 'Mã đơn vị vận chuyển không được quá 50 ký tự' })
  code?: string;

  @IsOptional()
  @IsString({ message: 'API endpoint phải là chuỗi ký tự' })
  @MaxLength(255, { message: 'API endpoint không được quá 255 ký tự' })
  api_endpoint?: string;

  @IsOptional()
  @IsString({ message: 'API key phải là chuỗi ký tự' })
  @MaxLength(255, { message: 'API key không được quá 255 ký tự' })
  api_key?: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @MaxLength(20, { message: 'Số điện thoại không được quá 20 ký tự' })
  contact_phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @MaxLength(100, { message: 'Email không được quá 100 ký tự' })
  contact_email?: string;

  @IsOptional()
  @IsInt({ message: 'Trạng thái phải là số nguyên' })
  is_active?: number;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  notes?: string;
}

