import { IsBoolean } from 'class-validator';

export class UpdateBrandStatusDto {
  @IsBoolean()
  is_active: boolean;
}

