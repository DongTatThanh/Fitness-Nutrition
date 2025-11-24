import { Controller, Post, Body, UnauthorizedException, Get, Req, UseGuards, Put, Patch, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminAuthService } from './admin-auth.service';
import { Admin2FAService } from './admin-2fa.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { Setup2FADto } from './dto/setup-2fa.dto';
import { Enable2FADto } from './dto/enable-2fa.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';

@Controller('admin/auth')
export class AdminController {
  constructor(
    private adminAuthService: AdminAuthService,
    private admin2FAService: Admin2FAService,
  ) {}

  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    const admin = await this.adminAuthService.validateAdmin(dto.email, dto.password);
    if (!admin) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng vui lòng thử lại');
    }

    // Kiểm tra nếu admin đã bật 2FA
    const is2FAEnabled = await this.admin2FAService.is2FAEnabled(admin.admin_id);
    
    if (is2FAEnabled) {
      // Tạo temp token cho 2FA verification
      const tempToken = await this.adminAuthService.createTempToken(admin);
      
      // Yêu cầu verify 2FA token
      return {
        requires2FA: true,
        temp_token: tempToken,
        adminId: admin.admin_id,
      };
    }

    // Nếu không có 2FA, đăng nhập bình thường
    return this.adminAuthService.login(admin);
  }

  /**
   * Verify 2FA token khi login
   */
  @Post('verify-2fa-login')
  async verify2FALogin(@Body() dto: Verify2FADto & { adminId: number }) {
    if (!dto.adminId) {
      throw new BadRequestException('Admin ID không được để trống');
    }

    const isValid = await this.admin2FAService.verifyAdmin2FA(dto.adminId, dto.token);
    
    if (!isValid) {
      throw new UnauthorizedException('Mã 2FA không đúng. Vui lòng thử lại.');
    }

    // Lấy admin và tạo token
    const admin = await this.adminAuthService['adminService'].findById(dto.adminId);
    if (!admin) {
      throw new UnauthorizedException('Admin không tồn tại');
    }

    return this.adminAuthService.login(admin);
  }

  @Get('profile')
  @UseGuards(AuthGuard('admin-jwt'))
  getProfile(@Req() req: any) {
    return req.user;
  }

  @Get('me')
  @UseGuards(AuthGuard('admin-jwt'))
  me(@Req() req: any) {
    return req.user;
  }

  @Post('logout')
  @UseGuards(AuthGuard('admin-jwt'))
  async logout(@Req() req: any) {
    return { message: 'Logged out successfully' };
  }

  // ==================== 2FA ENDPOINTS ====================

  /**
   * Setup 2FA - Tạo secret và QR code
   * POST /admin/auth/2fa/setup
   */
  @Post('2fa/setup')
  @UseGuards(AuthGuard('admin-jwt'))
  async setup2FA(@Body() dto: Setup2FADto, @Req() req: any) {
    const adminId = req.user?.adminId || req.user?.id || req.user?.sub;
    return this.admin2FAService.setup2FA(adminId, dto.password);
  }

  /**
   * Enable 2FA - Kích hoạt sau khi verify token
   * POST /admin/auth/2fa/enable
   */
  @Post('2fa/enable')
  @UseGuards(AuthGuard('admin-jwt'))
  async enable2FA(@Body() dto: Enable2FADto, @Req() req: any) {
    const adminId = req.user?.adminId || req.user?.id || req.user?.sub;
    return this.admin2FAService.enable2FA(adminId, dto.token);
  }

  /**
   * Disable 2FA - Tắt 2FA
   * POST /admin/auth/2fa/disable
   */
  @Post('2fa/disable')
  @UseGuards(AuthGuard('admin-jwt'))
  async disable2FA(@Body() dto: Setup2FADto, @Req() req: any) {
    const adminId = req.user?.adminId || req.user?.id || req.user?.sub;
    return this.admin2FAService.disable2FA(adminId, dto.password);
  }

  /**
   * Kiểm tra trạng thái 2FA
   * GET /admin/auth/2fa/status
   */
  @Get('2fa/status')
  @UseGuards(AuthGuard('admin-jwt'))
  async get2FAStatus(@Req() req: any) {
    const adminId = req.user?.adminId || req.user?.id || req.user?.sub;
    const isEnabled = await this.admin2FAService.is2FAEnabled(adminId);
    return {
      is2FAEnabled: isEnabled,
    };
  }
}

  