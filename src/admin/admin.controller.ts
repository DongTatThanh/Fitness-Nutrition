import { Controller, Post, Get, Body, UnauthorizedException, UseGuards, Request } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminService } from './admin.service';

@Controller('admin/auth')
export class AdminController {
  constructor(
    private adminAuthService: AdminAuthService,
    private adminService: AdminService,
  ) {}

  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    const admin = await this.adminAuthService.validateAdmin(dto.email, dto.password);
    if (!admin) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng vui lòng thử lại');
    }
    
    // Đăng nhập bình thường, không dùng 2FA cho admin thường
    return this.adminAuthService.login(admin);
  }

  /**
   * Lấy thông tin admin hiện tại (từ JWT token)
   * GET /admin/auth/me
   */
  @Get('me')
  @UseGuards(AdminAuthGuard)
  async getMe(@Request() req: any) {
    const adminId = req.user?.sub || req.user?.adminId || req.user?.id;
    if (!adminId) {
      throw new UnauthorizedException('Không tìm thấy thông tin admin');
    }

    const admin = await this.adminService.findById(adminId);
    if (!admin) {
      throw new UnauthorizedException('Admin không tồn tại');
    }

    // Trả về thông tin admin (không bao gồm password)
    const { password_hash, secret_2fa, ...adminInfo } = admin;
    return adminInfo;
  }
}

  