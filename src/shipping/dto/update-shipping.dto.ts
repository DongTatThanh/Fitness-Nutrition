import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, IsInt, Min, MaxLength } from 'class-validator';
import { ShippingStatus } from '../shipping.entity';

export class UpdateShippingDto {
  @IsOptional()
  @IsString({ message: 'Đơn vị vận chuyển phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Đơn vị vận chuyển không được quá 100 ký tự' })
  carrier?: string | null;

  @IsOptional()
  @IsString({ message: 'Loại dịch vụ phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Loại dịch vụ không được quá 100 ký tự' })
  service_type?: string | null;

  @IsOptional()
  @IsString({ message: 'Mã vận đơn phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Mã vận đơn không được quá 100 ký tự' })
  tracking_number?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày giao hàng dự kiến không đúng định dạng' })
  estimated_delivery_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày gửi hàng không đúng định dạng' })
  shipped_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày giao hàng không đúng định dạng' })
  delivered_date?: string;

  @IsOptional()
  @IsEnum(ShippingStatus, { message: 'Trạng thái không hợp lệ' })
  status?: ShippingStatus;

  @IsOptional()
  @IsNumber({}, { message: 'Phí vận chuyển phải là số' })
  @Min(0, { message: 'Phí vận chuyển phải lớn hơn hoặc bằng 0' })
  shipping_fee?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Phí bảo hiểm phải là số' })
  @Min(0, { message: 'Phí bảo hiểm phải lớn hơn hoặc bằng 0' })
  insurance_fee?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Phí COD phải là số' })
  @Min(0, { message: 'Phí COD phải lớn hơn hoặc bằng 0' })
  cod_fee?: number;

  @IsOptional()
  @IsInt({ message: 'Số lần giao hàng phải là số nguyên' })
  @Min(0, { message: 'Số lần giao hàng phải lớn hơn hoặc bằng 0' })
  delivery_attempts?: number;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  notes?: string | null;
}

