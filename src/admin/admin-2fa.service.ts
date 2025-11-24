import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { Admin } from './admin.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class Admin2FAService {
  constructor(
    @InjectRepository(Admin)
    private adminRepo: Repository<Admin>,
  ) {}

  /**
   * Tạo secret key và QR code cho 2FA
   */
  async setup2FA(adminId: number, password: string): Promise<{ secret: string; qrCodeUrl: string; manualEntryKey: string }> {
    const admin = await this.adminRepo.findOne({ where: { admin_id: adminId } });
    
    if (!admin) {
      throw new UnauthorizedException('Admin không tồn tại');
    }

    // Xác thực mật khẩu
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu không đúng');
    }

    // Tạo secret key
    const secret = speakeasy.generateSecret({
      name: `Admin (${admin.email})`,
      issuer: 'Fitness Nutrition System',
      length: 32,
    });

    // Tạo QR code URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Lưu secret vào database (chưa enable)
    await this.adminRepo.update(
      { admin_id: adminId },
      { secret_2fa: secret.base32 }
    );

    return {
      secret: secret.base32!,
      qrCodeUrl,
      manualEntryKey: secret.base32!,
    };
  }

  /**
   * Kích hoạt 2FA sau khi verify token
   */
  async enable2FA(adminId: number, token: string): Promise<{ message: string }> {
    const admin = await this.adminRepo.findOne({ where: { admin_id: adminId } });
    
    if (!admin) {
      throw new UnauthorizedException('Admin không tồn tại');
    }

    if (!admin.secret_2fa) {
      throw new BadRequestException('Chưa setup 2FA. Vui lòng setup 2FA trước.');
    }

    // Verify token
    const isValid = this.verifyToken(admin.secret_2fa, token);
    
    if (!isValid) {
      throw new UnauthorizedException('Mã 2FA không đúng. Vui lòng thử lại.');
    }

    // Enable 2FA
    await this.adminRepo.update(
      { admin_id: adminId },
      { is_2fa_enabled: 1 }
    );

    return { message: 'Kích hoạt 2FA thành công' };
  }

  /**
   * Tắt 2FA
   */
  async disable2FA(adminId: number, password: string): Promise<{ message: string }> {
    const admin = await this.adminRepo.findOne({ where: { admin_id: adminId } });
    
    if (!admin) {
      throw new UnauthorizedException('Admin không tồn tại');
    }

    // Xác thực mật khẩu
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu không đúng');
    }

    // Disable 2FA và xóa secret
    await this.adminRepo.update(
      { admin_id: adminId },
      { 
        is_2fa_enabled: 0,
        secret_2fa: null as any
      }
    );

    return { message: 'Tắt 2FA thành công' };
  }

  /**
   * Verify 2FA token
   */
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Cho phép sai lệch ±2 time steps (60 giây)
    });
  }

  /**
   * Kiểm tra admin có bật 2FA không
   */
  async is2FAEnabled(adminId: number): Promise<boolean> {
    const admin = await this.adminRepo.findOne({ 
      where: { admin_id: adminId },
      select: ['admin_id', 'is_2fa_enabled']
    });
    
    return admin?.is_2fa_enabled === 1;
  }

  /**
   * Verify 2FA token cho admin
   */
  async verifyAdmin2FA(adminId: number, token: string): Promise<boolean> {
    const admin = await this.adminRepo.findOne({ 
      where: { admin_id: adminId },
      select: ['admin_id', 'secret_2fa', 'is_2fa_enabled']
    });
    
    if (!admin || !admin.is_2fa_enabled || !admin.secret_2fa) {
      return false;
    }

    return this.verifyToken(admin.secret_2fa, token);
  }
}

