import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsPhoneNumber, MaxLength, isNotEmpty } from 'class-validator';

export class RegisterDto {

  @IsEmail()
  email: string;

  @IsOptional()
  @IsPhoneNumber('VN')
  phone?: string;

  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(30)
  password: string;

  @IsOptional()
  full_name?: string;
}
