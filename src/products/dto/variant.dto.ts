import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateVariantDto {
  @IsString()
  @Transform(({ value, obj }) => value || obj?.variant_name || obj?.variantName)
  variant_name: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  price: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value, obj }) => value ? Number(value) : (obj?.compare_price ? Number(obj.compare_price) : undefined))
  compare_price?: number;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  quantity: number;

  @IsOptional()
  @Transform(({ value, obj }) => value ?? obj?.attribute_values ?? obj?.attributeValues)
  attribute_values?: any;

  @IsOptional()
  image?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';
}

export class UpdateVariantDto {
  @IsOptional()
  @IsString()
  @Transform(({ value, obj }) => value || obj?.variant_name || obj?.variantName)
  variant_name?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? Number(value) : undefined)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value, obj }) => value ? Number(value) : (obj?.compare_price ? Number(obj.compare_price) : undefined))
  compare_price?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? Number(value) : undefined)
  quantity?: number;

  @IsOptional()
  @Transform(({ value, obj }) => value ?? obj?.attribute_values ?? obj?.attributeValues)
  attribute_values?: any;

  @IsOptional()
  image?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
