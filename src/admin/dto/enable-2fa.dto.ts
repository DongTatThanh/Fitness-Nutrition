import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class Enable2FADto {
  @IsNotEmpty({ message: 'Mã 2FA không được để trống' })
  @IsString({ message: 'Mã 2FA phải là chuỗi ký tự' })
  @Length(6, 6, { message: 'Mã 2FA phải có đúng 6 chữ số' })
  @Matches(/^\d{6}$/, { message: 'Mã 2FA phải là 6 chữ số' })
  token: string;
}

