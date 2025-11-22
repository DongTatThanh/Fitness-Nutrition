import { Controller, Post, Body, UnauthorizedException, Get, Req, UseGuards, Put } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('admin/auth')
export class AdminController {
  constructor(private adminAuthService: AdminAuthService) {}

  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    const admin = await this.adminAuthService.validateAdmin(dto.email, dto.password);
    if (!admin) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng vui lòng thử lại');
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
}

