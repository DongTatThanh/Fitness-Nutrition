import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class AdminProductFilterDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'inactive', 'out_of_stock'])
  status?: 'draft' | 'active' | 'inactive' | 'out_of_stock';

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  brandId?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isNewArrival?: boolean;

  @IsOptional()
  @IsBoolean()
  isBestseller?: boolean;

  @IsOptional()
  @IsBoolean()
  isOnSale?: boolean;

  @IsOptional()
  @IsEnum(['name', 'price', 'created_at', 'inventory_quantity'])
  sortBy?: 'name' | 'price' | 'created_at' | 'inventory_quantity';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
