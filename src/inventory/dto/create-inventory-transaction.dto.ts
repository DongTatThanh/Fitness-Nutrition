import { IsNotEmpty, IsOptional, IsInt, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { TransactionType, ReferenceType } from '../inventory-transaction.entity';

export class CreateInventoryTransactionDto {
  @IsNotEmpty({ message: 'Product ID không được để trống' })
  @IsInt({ message: 'Product ID phải là số nguyên' })
  product_id: number;

  @IsOptional()
  @IsInt({ message: 'Variant ID phải là số nguyên' })
  variant_id?: number | null;

  @IsNotEmpty({ message: 'Loại giao dịch không được để trống' })
  @IsEnum(TransactionType, { message: 'Loại giao dịch không hợp lệ' })
  transaction_type: TransactionType;

  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  quantity: number;

  @IsOptional()
  @IsNumber({}, { message: 'Giá đơn vị phải là số' })
  @Min(0, { message: 'Giá đơn vị phải lớn hơn hoặc bằng 0' })
  unit_cost?: number | null;

  @IsOptional()
  @IsNumber({}, { message: 'Tổng giá trị phải là số' })
  @Min(0, { message: 'Tổng giá trị phải lớn hơn hoặc bằng 0' })
  total_cost?: number | null;

  @IsOptional()
  @IsEnum(ReferenceType, { message: 'Loại tham chiếu không hợp lệ' })
  reference_type?: ReferenceType | null;

  @IsOptional()
  @IsInt({ message: 'Reference ID phải là số nguyên' })
  reference_id?: number | null;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  notes?: string | null;
}

