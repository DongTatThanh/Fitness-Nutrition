import { IsString, IsEmail, IsOptional, MinLength, MaxLength, IsInt, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty({ message: 'Username không được để trống' })
    @IsString({ message: 'Username phải là chuỗi ký tự' })
    @MinLength(3, { message: 'Username phải có ít nhất 3 ký tự' })
    @MaxLength(50, { message: 'Username không được quá 50 ký tự' })
    username: string;

    @IsNotEmpty({ message: 'Email không được để trống' })
    @IsEmail({}, { message: 'Email không đúng định dạng. Vui lòng nhập email hợp lệ' })
    @MaxLength(100, { message: 'Email không được quá 100 ký tự' })
    email: string;

    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
    @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    @MaxLength(50, { message: 'Mật khẩu không được quá 50 ký tự' })
    password: string;

    @IsOptional()
    @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
    @MaxLength(20, { message: 'Số điện thoại không được quá 20 ký tự' })
    phone?: string;

    @IsOptional()
    @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
    @MaxLength(100, { message: 'Họ tên không được quá 100 ký tự' })
    full_name?: string;

    @IsOptional()
    @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
    address?: string;

    @IsOptional()
    @IsInt({ message: 'role_id phải là số nguyên' })
    role_id?: number;
}
