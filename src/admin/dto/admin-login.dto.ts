import { IsEmail, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class AdminLoginDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng. Vui lòng nhập email hợp lệ' })
  @MaxLength(100, { message: 'Email không được vượt quá 100 ký tự' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(50, { message: 'Mật khẩu không được vượt quá 50 ký tự' })
  password: string;
}

