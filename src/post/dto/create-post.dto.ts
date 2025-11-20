import { IsString, IsNotEmpty, IsInt, IsOptional, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsInt()
  @IsNotEmpty({ message: 'Category ID là bắt buộc' })
  category_id: number;

  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề là bắt buộc' })
  @MaxLength(255, { message: 'Tiêu đề không được vượt quá 255 ký tự' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug là bắt buộc' })
  @MaxLength(255, { message: 'Slug không được vượt quá 255 ký tự' })
  slug: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Thumbnail không được vượt quá 500 ký tự' })
  thumbnail?: string;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung là bắt buộc' })
  content: string;

  @IsString()
  @IsNotEmpty({ message: 'Tác giả là bắt buộc' })
  @MaxLength(255, { message: 'Tên tác giả không được vượt quá 255 ký tự' })
  author: string;

  @IsInt()
  @IsOptional()
  is_featured?: number;
}