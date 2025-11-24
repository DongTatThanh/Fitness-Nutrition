import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AdminService } from './admin.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminAuthService {
  constructor(
    private adminService: AdminService,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(email: string, pass: string) {
    const admin = await this.adminService.findByEmail(email);
    if (!admin) return null;
    
    // Check if admin is active
    if (admin.is_active !== 1) {
      throw new UnauthorizedException('Tài khoản admin đã bị vô hiệu hóa');
    }
    
    const matches = await bcrypt.compare(pass, admin.password_hash);
    if (matches) return admin;
    return null;
  }

  async login(admin: any) {
    const payload = { 
      sub: admin.admin_id, 
      email: admin.email, 
      role: admin.role || 'admin',
      type: 'admin' // Đánh dấu đây là admin token
    };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'change_this_secret',
      }),
    };
  }

  /**
   * Tạo temp token cho 2FA verification
   * Token này có thời gian ngắn (5 phút) chỉ để verify 2FA
   */
  async createTempToken(admin: any) {
    const payload = { 
      sub: admin.admin_id, 
      email: admin.email, 
      role: admin.role || 'admin',
      type: 'admin',
      temp: true, // Đánh dấu đây là temp token
      purpose: '2fa_verification'
    };
    return this.jwtService.sign(payload, {
      secret: process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'change_this_secret',
      expiresIn: '5m', // Temp token chỉ có hiệu lực 5 phút
    });
  }
}

