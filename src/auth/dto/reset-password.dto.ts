import { IsNotEmpty, MinLength, IsNumberString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @IsNumberString({}, { message: 'Mã OTP phải là số' })
  @Length(6, 6, { message: 'Mã OTP phải có đúng 6 chữ số' })
  otp: string;

  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  newPassword: string;
}
