import { IsNotEmpty, IsString, IsOptional, IsArray, MaxLength } from 'class-validator';

export class CreateShippingZoneDto {
  @IsNotEmpty({ message: 'Tên khu vực không được để trống' })
  @IsString({ message: 'Tên khu vực phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Tên khu vực không được quá 100 ký tự' })
  name: string;

  @IsNotEmpty({ message: 'Mã khu vực không được để trống' })
  @IsString({ message: 'Mã khu vực phải là chuỗi ký tự' })
  @MaxLength(50, { message: 'Mã khu vực không được quá 50 ký tự' })
  code: string;

  @IsOptional()
  @IsArray({ message: 'Danh sách tỉnh/thành phố phải là mảng' })
  provinces?: string[];

  @IsOptional()
  @IsArray({ message: 'Danh sách quận/huyện phải là mảng' })
  districts?: string[];
}

