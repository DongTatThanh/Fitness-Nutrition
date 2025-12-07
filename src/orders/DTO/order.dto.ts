import { IsNotEmpty, IsString, IsEmail, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateOrderDto {
    @IsNotEmpty()
    @IsString()
    customer_name: string;

    @IsNotEmpty()
    @IsEmail()
    customer_email: string;

    @IsNotEmpty()
    @IsString()
    customer_phone: string;

    @IsNotEmpty()
    @IsString()
    shipping_address: string;

    @IsOptional()
    @IsString()
    shipping_city?: string;

    @IsOptional()
    @IsString()
    shipping_district?: string;

    @IsOptional()
    @IsString()
    shipping_ward?: string;

    @IsOptional()
    @IsString()
    shipping_postal_code?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    shipping_fee?: number;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    discount_code?: string;



}
