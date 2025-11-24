import { IsOptional, IsInt, IsString, IsDateString, IsEnum } from 'class-validator';
import { PurchaseOrderStatus } from '../purchase-order.entity';

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsInt({ message: 'Supplier ID phải là số nguyên' })
  supplier_id?: number | null;

  @IsOptional()
  @IsEnum(PurchaseOrderStatus, { message: 'Trạng thái không hợp lệ' })
  status?: PurchaseOrderStatus;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  notes?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày giao hàng dự kiến không đúng định dạng' })
  expected_delivery_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày nhận hàng không đúng định dạng' })
  received_date?: string;
}

