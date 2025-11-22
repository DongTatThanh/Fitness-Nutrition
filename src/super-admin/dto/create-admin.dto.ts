import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString, IsIn, Matches, MaxLength } from 'class-validator';

export class CreateAdminDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng. Vui lòng nhập email hợp lệ' })
  @MaxLength(100, { message: 'Email không được vượt quá 100 ký tự' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(50, { message: 'Mật khẩu không được vượt quá 50 ký tự' })
  password: string;

  @IsOptional()
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Họ và tên không được vượt quá 100 ký tự' })
  full_name?: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @Matches(/^[0-9]{10,11}$/, { message: 'Số điện thoại phải là số và có từ 10-11 chữ số' })
  phone?: string;

  @IsOptional()
  @IsIn(['admin', 'manager'], { message: 'Role phải là một trong các giá trị: admin, manager. Không được tạo Super Admin.' })
  role?: string;
}

