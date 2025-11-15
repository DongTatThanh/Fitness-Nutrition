
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsInt, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @MaxLength(100, { message: 'Tên danh mục tối đa 100 ký tự' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug không được để trống' })
  @MaxLength(100, { message: 'Slug tối đa 100 ký tự' })
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt({ message: 'Parent ID phải là số nguyên' })
  @IsOptional()
  @Min(0)
  parent_id?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  icon?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  sort_order?: number;

  @IsString()
  @IsOptional()
  status?: 'active' | 'inactive';
}