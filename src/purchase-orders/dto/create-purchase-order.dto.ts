import { IsNotEmpty, IsOptional, IsInt, IsString, IsDateString, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddItemDto {
  @IsNotEmpty({ message: 'Product ID không được để trống' })
  @IsInt({ message: 'Product ID phải là số nguyên' })
  product_id: number;

  @IsOptional()
  @IsInt({ message: 'Variant ID phải là số nguyên' })
  variant_id?: number | null;

  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  quantity_ordered: number;

  @IsNotEmpty({ message: 'Giá nhập không được để trống' })
  @IsNumber({}, { message: 'Giá nhập phải là số' })
  @Min(0, { message: 'Giá nhập phải lớn hơn hoặc bằng 0' })
  unit_cost: number;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  notes?: string;
}

export class CreatePurchaseOrderDto {
  @IsOptional()
  @IsInt({ message: 'Supplier ID phải là số nguyên' })
  supplier_id?: number | null;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  notes?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày giao hàng dự kiến không đúng định dạng' })
  expected_delivery_date?: string;

  @IsNotEmpty({ message: 'Danh sách sản phẩm không được để trống' })
  @IsArray({ message: 'Danh sách sản phẩm phải là mảng' })
  @ValidateNested({ each: true })
  @Type(() => AddItemDto)
  items: AddItemDto[];
}

