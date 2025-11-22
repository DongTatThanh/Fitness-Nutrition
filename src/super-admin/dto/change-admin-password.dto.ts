import { IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangeAdminPasswordDto {
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  @MaxLength(50, { message: 'Mật khẩu mới không được vượt quá 50 ký tự' })
  newPassword: string;
}

