import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Tên danh mục không được vượt quá 255 ký tự' })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Slug không được vượt quá 255 ký tự' })
  slug?: string;

  @IsInt()
  @IsOptional()
  parent_id?: number;

  @IsInt()
  @IsOptional()
  sort_order?: number;
}

