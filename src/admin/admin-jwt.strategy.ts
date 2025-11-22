import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminService } from './admin.service';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(private adminService: AdminService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'change_this_secret',
    });
  }

  async validate(payload: any) {
    // Verify this is an admin token
    if (!payload || payload.type !== 'admin') {
      return null; // Sẽ throw UnauthorizedException tự động
    }
    
    const admin = await this.adminService.findById(payload.sub);
    if (!admin) {
      return null; // Admin không tồn tại
    }
    
    if (admin.is_active !== 1) {
      return null; // Admin đã bị vô hiệu hóa
    }
    
    return { 
      id: payload.sub, 
      adminId: payload.sub, 
      email: payload.email, 
      role: payload.role || admin.role || 'admin',
      type: 'admin'
    };
  }
}

