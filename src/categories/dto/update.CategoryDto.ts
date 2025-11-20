import { IsString, IsOptional, MaxLength, IsInt, Min, IsBoolean } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
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

   @IsBoolean()
  @IsOptional()
   is_active?: boolean;

}
