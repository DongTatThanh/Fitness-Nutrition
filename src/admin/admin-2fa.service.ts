import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

@Injectable()
export class Admin2FAService {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Kiểm tra admin đã bật 2FA hay chưa
   */
  async is2FAEnabled(adminId: number): Promise<boolean> {
    const admin = await this.adminService.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin không tồn tại');
    }
    return admin.is_2fa_enabled === 1;
  }

  /**
   * Tạo secret 2FA và QR code cho admin (dùng cho Super Admin setup 2FA)
   */
  async setup2FA(adminId: number, password: string): Promise<{
    otpauthUrl: string;
    qrCodeDataUrl: string;
    secret: string;
  }> {
    const admin = await this.adminService.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin không tồn tại');
    }

    // Xác thực mật khẩu trước khi setup 2FA
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu không đúng. Không thể setup 2FA.');
    }

    // Tạo secret mới cho 2FA
    const secret = speakeasy.generateSecret({
      name: `FitnessNutrition Admin (${admin.email})`,
      length: 20,
    });

    // Lưu secret dưới dạng base32 vào database, chưa bật 2FA
    await this.adminService.updateProfile(adminId, {
      secret_2fa: secret.base32,
      is_2fa_enabled: 0,
    });

    const otpauthUrl = secret.otpauth_url || speakeasy.otpauthURL({
      secret: secret.base32,
      label: `FitnessNutrition Admin (${admin.email})`,
      issuer: 'FitnessNutrition',
      encoding: 'base32',
    });

    // Tạo QR code base64 để frontend hiển thị
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    return {
      otpauthUrl,
      qrCodeDataUrl,
      secret: secret.base32,
    };
  }

  /**
   * Enable 2FA sau khi người dùng đã quét QR và nhập mã 6 số đúng
   */
  async enable2FA(adminId: number, token: string): Promise<{ is2FAEnabled: boolean }> {
    const admin = await this.adminService.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin không tồn tại');
    }

    if (!admin.secret_2fa) {
      throw new BadRequestException('2FA chưa được setup cho tài khoản này');
    }

    const isValid = speakeasy.totp.verify({
      secret: admin.secret_2fa,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!isValid) {
      throw new UnauthorizedException('Mã 2FA không đúng. Vui lòng thử lại.');
    }

    await this.adminService.updateProfile(adminId, {
      is_2fa_enabled: 1,
    });

    return { is2FAEnabled: true };
  }

  /**
   * Verify token 2FA khi đăng nhập
   */
  async verifyAdmin2FA(adminId: number, token: string): Promise<boolean> {
    const admin = await this.adminService.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin không tồn tại');
    }

    if (!admin.secret_2fa || admin.is_2fa_enabled !== 1) {
      // Chưa bật 2FA hoặc chưa setup secret
      return false;
    }

    const isValid = speakeasy.totp.verify({
      secret: admin.secret_2fa,
      encoding: 'base32',
      token,
      window: 1,
    });

    return !!isValid;
  }

  /**
   * Disable 2FA (dùng khi muốn tắt 2FA cho admin)
   */
  async disable2FA(adminId: number, password: string): Promise<{ is2FAEnabled: boolean }> {
    const admin = await this.adminService.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin không tồn tại');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu không đúng. Không thể tắt 2FA.');
    }

    await this.adminService.updateProfile(adminId, {
      secret_2fa: null,
      is_2fa_enabled: 0,
    } as any);

    return { is2FAEnabled: false };
  }
}


