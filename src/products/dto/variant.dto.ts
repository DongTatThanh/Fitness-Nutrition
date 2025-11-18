import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Expose, Transform } from 'class-transformer';

export class CreateVariantDto {
  @IsString()
  @Expose({ name: 'variant_name' })
  @Transform(({ value, obj }) => value ?? obj?.variant_name, { toClassOnly: true })
  variantName: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  @Expose({ name: 'compare_price' })
  @Transform(({ value, obj }) => value ?? obj?.compare_price, { toClassOnly: true })
  comparePrice?: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @Expose({ name: 'attribute_values' })
  @Transform(({ value, obj }) => value ?? obj?.attribute_values, { toClassOnly: true })
  attributeValues?: any;

  @IsOptional()
  image?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';
}

export class UpdateVariantDto {
  @IsOptional()
  @IsString()
  @Expose({ name: 'variant_name' })
  @Transform(({ value, obj }) => value ?? obj?.variant_name, { toClassOnly: true })
  variantName?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  @Expose({ name: 'compare_price' })
  @Transform(({ value, obj }) => value ?? obj?.compare_price, { toClassOnly: true })
  comparePrice?: number;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @Expose({ name: 'attribute_values' })
  @Transform(({ value, obj }) => value ?? obj?.attribute_values, { toClassOnly: true })
  attributeValues?: any;

  @IsOptional()
  image?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
