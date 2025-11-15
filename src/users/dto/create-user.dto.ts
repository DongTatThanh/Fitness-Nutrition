import { IsString, IsEmail, IsOptional, MinLength, MaxLength, IsInt } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @MinLength(3, { message: 'Username phải có ít nhất 3 ký tự' })
    @MaxLength(50, { message: 'Username không được quá 50 ký tự' })
    username: string;

    @IsEmail({}, { message: 'Email không đúng định dạng' })
    @MaxLength(100, { message: 'Email không được quá 100 ký tự' })
    email: string;

    @IsString()
    @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    password: string;

    @IsOptional()
    @IsString()
    @MaxLength(20, { message: 'Số điện thoại không được quá 20 ký tự' })
    phone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Họ tên không được quá 100 ký tự' })
    full_name?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsInt({ message: 'role_id phải là số nguyên' })
    role_id?: number;
}
