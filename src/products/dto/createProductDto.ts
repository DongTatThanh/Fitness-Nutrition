
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';

export class ProductAttributeDto {
  @IsString()
  name: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateProductDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(220)
  slug: string;

  @IsString()
  @MaxLength(100)
  sku: string;

  @IsNumber()
  @Expose({ name: 'brand_id' })
  @Transform(({ value, obj }) => value ?? obj?.brand_id, { toClassOnly: true })
  brandId: number;

  @IsNumber()
  @Expose({ name: 'category_id' })
  @Transform(({ value, obj }) => value ?? obj?.category_id, { toClassOnly: true })
  categoryId: number;

  @IsOptional()
  @IsString()
  @Expose({ name: 'short_description' })
  @Transform(({ value, obj }) => value ?? obj?.short_description, { toClassOnly: true })
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  ingredients?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'usage_instructions' })
  @Transform(({ value, obj }) => value ?? obj?.usage_instructions, { toClassOnly: true })
  usageInstructions?: string;

  @IsOptional()
  @IsString()
  warnings?: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  @Expose({ name: 'compare_price' })
  @Transform(({ value, obj }) => value ?? obj?.compare_price, { toClassOnly: true })
  comparePrice?: number;

  @IsOptional()
  @IsNumber()
  @Expose({ name: 'cost_price' })
  @Transform(({ value, obj }) => value ?? obj?.cost_price, { toClassOnly: true })
  costPrice?: number;

  @IsOptional()
  @IsBoolean()
  @Expose({ name: 'track_inventory' })
  @Transform(({ value, obj }) => value ?? obj?.track_inventory, { toClassOnly: true })
  trackInventory?: boolean;

  @IsOptional()
  @IsNumber()
  @Expose({ name: 'inventory_quantity' })
  @Transform(({ value, obj }) => value ?? obj?.inventory_quantity ?? obj?.quantity, {
    toClassOnly: true,
  })
  inventoryQuantity?: number;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Expose({ name: 'low_stock_threshold' })
  @Transform(({ value, obj }) => value ?? obj?.low_stock_threshold, { toClassOnly: true })
  lowStockThreshold?: number;

  @IsOptional()
  @IsDateString()
  @Expose({ name: 'expiry_date' })
  @Transform(({ value, obj }) => value ?? obj?.expiry_date, { toClassOnly: true })
  expiryDate?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'batch_number' })
  @Transform(({ value, obj }) => value ?? obj?.batch_number, { toClassOnly: true })
  batchNumber?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'origin_country' })
  @Transform(({ value, obj }) => value ?? obj?.origin_country, { toClassOnly: true })
  originCountry?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'manufacturer' })
  @Transform(({ value, obj }) => value ?? obj?.manufacturer, { toClassOnly: true })
  manufacturer?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'featured_image' })
  @Transform(({ value, obj }) => value ?? obj?.featured_image, { toClassOnly: true })
  featuredImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Expose({ name: 'gallery_images' })
  @Transform(({ value, obj }) => value ?? obj?.gallery_images, { toClassOnly: true })
  galleryImages?: string[];

  @IsOptional()
  @IsString()
  @Expose({ name: 'meta_title' })
  @Transform(({ value, obj }) => value ?? obj?.meta_title, { toClassOnly: true })
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'meta_description' })
  @Transform(({ value, obj }) => value ?? obj?.meta_description, { toClassOnly: true })
  metaDescription?: string;

  @IsOptional()
  @IsBoolean()
  @Expose({ name: 'is_featured' })
  @Transform(({ value, obj }) => value ?? obj?.is_featured, { toClassOnly: true })
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  @Expose({ name: 'is_new_arrival' })
  @Transform(({ value, obj }) => value ?? obj?.is_new_arrival, { toClassOnly: true })
  isNewArrival?: boolean;

  @IsOptional()
  @IsBoolean()
  @Expose({ name: 'is_bestseller' })
  @Transform(({ value, obj }) => value ?? obj?.is_bestseller, { toClassOnly: true })
  isBestseller?: boolean;

  @IsOptional()
  @IsBoolean()
  @Expose({ name: 'is_on_sale' })
  @Transform(({ value, obj }) => value ?? obj?.is_on_sale, { toClassOnly: true })
  isOnSale?: boolean;

  @IsOptional()
  @IsEnum(['draft', 'active', 'inactive', 'out_of_stock'])
  status?: 'draft' | 'active' | 'inactive' | 'out_of_stock';

  @IsOptional()
  @IsDateString()
  @Expose({ name: 'published_at' })
  @Transform(({ value, obj }) => value ?? obj?.published_at, { toClassOnly: true })
  publishedAt?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  attributes?: ProductAttributeDto[];
}
