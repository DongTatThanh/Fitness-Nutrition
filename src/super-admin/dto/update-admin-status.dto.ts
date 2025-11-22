import { IsNotEmpty, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdateAdminStatusDto {
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @Transform(({ value }) => {
    // Chuyển đổi string "0" hoặc "1" thành number
    if (value === '0' || value === 0) {
      return 0;
    }
    if (value === '1' || value === 1) {
      return 1;
    }
    return value;
  })
  @Type(() => Number)
  @IsIn([0, 1], { message: 'Trạng thái phải là 0 (vô hiệu hóa) hoặc 1 (kích hoạt)' })
  is_active: number;
}

