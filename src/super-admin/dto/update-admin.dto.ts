import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class UpdateAdminDto {
  @IsOptional()
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Họ và tên không được vượt quá 100 ký tự' })
  full_name?: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @Matches(/^[0-9]{10,11}$/, { message: 'Số điện thoại phải là số và có từ 10-11 chữ số' })
  phone?: string;
}

