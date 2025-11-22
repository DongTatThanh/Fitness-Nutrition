import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AdminAuthGuard } from '../admin/admin-auth.guard';

@Injectable()
export class SuperAdminGuard extends AdminAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const result = await super.canActivate(context);
      
      if (!result) {
        throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại');
      }
      
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      
      if (!user) {
        throw new UnauthorizedException('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại');
      }
      
      if (user.role !== 'super_admin') {
        throw new ForbiddenException('Chỉ Super Admin mới có quyền truy cập chức năng này. Bạn không có quyền truy cập');
      }
      
      return true;
    } catch (error) {
      // Nếu đã là exception thì throw lại
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      // Nếu là lỗi từ AuthGuard (thường là Unauthorized)
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại');
    }
  }
}

