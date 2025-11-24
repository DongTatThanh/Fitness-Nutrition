import { IsNotEmpty, IsString, IsOptional, IsEmail, MaxLength, IsInt } from 'class-validator';

export class CreateSupplierDto {
  @IsNotEmpty({ message: 'Tên nhà cung cấp không được để trống' })
  @IsString({ message: 'Tên nhà cung cấp phải là chuỗi ký tự' })
  @MaxLength(200, { message: 'Tên nhà cung cấp không được quá 200 ký tự' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Người liên hệ phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Người liên hệ không được quá 100 ký tự' })
  contact_person?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @MaxLength(100, { message: 'Email không được quá 100 ký tự' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @MaxLength(20, { message: 'Số điện thoại không được quá 20 ký tự' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Mã số thuế phải là chuỗi ký tự' })
  @MaxLength(50, { message: 'Mã số thuế không được quá 50 ký tự' })
  tax_code?: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  notes?: string;
}

