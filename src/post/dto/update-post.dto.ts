import { IsString, IsInt, IsOptional, MaxLength } from 'class-validator';

export class UpdatePostDto {
  @IsInt()
  @IsOptional()
  category_id?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Tiêu đề không được vượt quá 255 ký tự' })
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Slug không được vượt quá 255 ký tự' })
  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Thumbnail không được vượt quá 500 ký tự' })
  thumbnail?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Tên tác giả không được vượt quá 255 ký tự' })
  author?: string;

  @IsInt()
  @IsOptional()
  is_featured?: number;
}