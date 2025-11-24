import { IsNotEmpty, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ShipmentStatus } from '../shipment.entity';

export class UpdateShipmentStatusDto {
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsEnum(ShipmentStatus, { message: 'Trạng thái không hợp lệ' })
  status: ShipmentStatus;

  @IsOptional()
  @IsString({ message: 'Vị trí phải là chuỗi ký tự' })
  @MaxLength(255, { message: 'Vị trí không được quá 255 ký tự' })
  location?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  description?: string;
}

