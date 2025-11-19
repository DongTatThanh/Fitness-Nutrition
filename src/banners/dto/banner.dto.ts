import { IsString, IsInt, IsBoolean, IsOptional, IsUrl, IsDateString, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBannerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  image_url?: string; // Will be set by controller after upload

  @IsOptional()
  @IsString()
  link_url?: string;

  @IsOptional()
  @IsIn(['_self', '_blank', '_parent', '_top'])
  link_target?: string;

  @IsInt()
  @Type(() => Number)
  position: number; // 1=Header, 2=Sidebar, 3=Footer, 4=Home Page...

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  sort_order?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  created_by?: number;
}

export class UpdateBannerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsString()
  link_url?: string;

  @IsOptional()
  @IsIn(['_self', '_blank', '_parent', '_top'])
  link_target?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  position?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  sort_order?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean;
}
