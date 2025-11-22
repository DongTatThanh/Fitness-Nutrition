import { IsNotEmpty, IsIn, IsString } from 'class-validator';

export class UpdateAdminRoleDto {
  @IsNotEmpty({ message: 'Role không được để trống' })
  @IsString({ message: 'Role phải là chuỗi ký tự' })
  @IsIn(['admin', 'manager'], { 
    message: 'Role phải là một trong các giá trị: admin, manager. Không được đổi thành Super Admin.' 
  })
  role: string;
}

