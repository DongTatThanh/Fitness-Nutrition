import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên danh mục là bắt buộc' })
  @MaxLength(255, { message: 'Tên danh mục không được vượt quá 255 ký tự' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug là bắt buộc' })
  @MaxLength(255, { message: 'Slug không được vượt quá 255 ký tự' })
  slug: string;

  @IsInt()
  @IsOptional()
  parent_id?: number;

  @IsInt()
  @IsOptional()
  sort_order?: number;
}

