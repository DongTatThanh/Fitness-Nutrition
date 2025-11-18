import { IsString, IsNotEmpty, IsNumber, IsDate, IsEnum, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum DiscountType {
    PERCENTAGE = 'percentage',
    FIXED = 'fixed',
    FREE_SHIPPING = 'free_shipping'
}

export enum ApplicableType {
    ALL = 'all',
    CATEGORIES = 'categories',
    PRODUCTS = 'products',
    CUSTOMERS = 'customers'
}

export class CreateDiscountCodeDto {
    @IsString()
    @IsNotEmpty()
    code: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(DiscountType)
    @IsNotEmpty()
    discount_type: DiscountType;

    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    discount_value: number; // Frontend gửi discount_value

    @IsNumber()
    @IsOptional()
    @Min(0)
    min_order_value?: number; // Frontend gửi min_order_value

    @IsNumber()
    @IsOptional()
    @Min(0)
    max_discount_amount?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    usage_limit?: number; // 0 = unlimited

    @IsNumber()
    @IsOptional()
    @Min(0)
    usage_limit_per_customer?: number; // 0 = unlimited

    @IsDate()
    @Type(() => Date)
    @IsNotEmpty()
    start_date: Date;

    @IsDate()
    @Type(() => Date)
    @IsNotEmpty()
    end_date: Date;

    @IsEnum(ApplicableType)
    @IsOptional()
    applicable_type?: ApplicableType;

    @IsOptional()
    applicable_items?: any; // JSON field

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @IsString()
    @IsOptional()
    image_url?: string; // Frontend gửi image_url
}
