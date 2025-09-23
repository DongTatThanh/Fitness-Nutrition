import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}