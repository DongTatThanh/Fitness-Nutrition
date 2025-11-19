import { IsString, IsOptional, IsDateString, IsBoolean, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFlashSaleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  start_time: string;

  @IsDateString()
  end_time: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateFlashSaleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  start_time?: string;

  @IsOptional()
  @IsDateString()
  end_time?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class AddProductToFlashSaleDto {
  @IsNumber()
  product_id: number;

  @IsOptional()
  @IsNumber()
  variant_id?: number;

  @IsNumber()
  sale_price: number;

  @IsOptional()
  @IsNumber()
  original_price?: number;

  @IsOptional()
  @IsNumber()
  max_quantity?: number;
}

export class UpdateFlashSaleProductDto {
  @IsOptional()
  @IsNumber()
  sale_price?: number;

  @IsOptional()
  @IsNumber()
  original_price?: number;

  @IsOptional()
  @IsNumber()
  max_quantity?: number;
}

export class BulkAddProductsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddProductToFlashSaleDto)
  products: AddProductToFlashSaleDto[];
}
