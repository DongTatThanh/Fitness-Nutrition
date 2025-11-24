import { IsNotEmpty, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAdminStatusDto {
  @Type(() => Number)
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsInt({ message: 'Trạng thái phải là số nguyên' })
  @Min(0, { message: 'Trạng thái phải là 0 hoặc 1' })
  @Max(1, { message: 'Trạng thái phải là 0 hoặc 1' })
  @IsIn([0, 1], { message: 'Trạng thái phải là 0 (vô hiệu hóa) hoặc 1 (kích hoạt)' })
  is_active: number;
}

