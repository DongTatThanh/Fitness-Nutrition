import { IsString, IsEmail, IsOptional, MinLength, MaxLength, IsInt } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString({ message: 'Username phải là chuỗi ký tự' })
    @MinLength(3, { message: 'Username phải có ít nhất 3 ký tự' })
    @MaxLength(50, { message: 'Username không được quá 50 ký tự' })
    username?: string;

    @IsOptional()
    @IsEmail({}, { message: 'Email không đúng định dạng. Vui lòng nhập email hợp lệ' })
    @MaxLength(100, { message: 'Email không được quá 100 ký tự' })
    email?: string;
      

  
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
