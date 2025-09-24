import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PasswordReset } from './password-reset.entity';
import { randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';


@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  @InjectRepository(PasswordReset)
  private passwordResetRepo: Repository<PasswordReset>,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const matches = await bcrypt.compare(pass, user.password_hash);
    if (matches) return user;
    return null;
  }

  async login(user: any) {
    const payload = { sub: user.user_id, email: user.email, role: (user.role || 'user') };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(createUserDto: any) {
    const existing = await this.usersService.findByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    if (createUserDto.phone) {
      const existingPhone = await this.usersService.findByPhone(createUserDto.phone);
      if (existingPhone) throw new ConflictException('Phone already in use');
    }
    const hash = await bcrypt.hash(createUserDto.password, 10);
    // generate a username from email local part if not provided
    const emailLocal = (createUserDto.email || '').split('@')[0] || '';
    let username = (createUserDto as any).username || emailLocal.replace(/[^a-zA-Z0-9]/g, '');
    if (!username) {
      username = `user${Date.now().toString().slice(-6)}${Math.floor(Math.random()*1000)}`;
    }

    const user = await this.usersService.create({
      username,
      email: createUserDto.email,
      password_hash: hash,
      full_name: createUserDto.full_name,
      phone: createUserDto.phone,
    });
    return this.login(user);
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User with email not found');
    
    // Generate 6-digit OTP instead of hex token
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes
    const record = this.passwordResetRepo.create({ user_id: user.user_id, token: otpCode, expires_at: expiresAt });
    await this.passwordResetRepo.save(record);
    
    // send email via nodemailer if SMTP is configured
    const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: user.email,
      subject: 'Mã xác thực đặt lại mật khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">🔐 Đặt lại mật khẩu</h2>
          <p>Bạn đã yêu cầu đặt lại mật khẩu. Sử dụng mã OTP sau để tiếp tục:</p>
          
          <div style="background: #f8f9fa; padding: 30px; text-align: center; border-radius: 10px; margin: 25px 0; border: 2px dashed #007bff;">
            <h1 style="color: #007bff; font-size: 40px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otpCode}</h1>
            <p style="color: #666; margin-top: 15px; font-size: 14px;">⏰ Mã có hiệu lực trong <strong>15 phút</strong></p>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;"><strong>⚠️ Lưu ý quan trọng:</strong></p>
            <ul style="color: #856404; margin: 10px 0 0 20px;">
              <li>Mã OTP chỉ sử dụng được <strong>một lần duy nhất</strong></li>
              <li>Không chia sẻ mã này với bất kì ai</li>
              <li>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này</li>
            </ul>
          </div>
          
          <p style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
            Email này được gửi từ hệ thống Fitness & Nutrition
          </p>
        </div>
      `,
    };

    if (smtpConfigured) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      try {
        await transporter.sendMail(mailOptions);
      } catch (err) {
        // log but don't fail the request
        console.error('Failed to send reset email', err);
      }
    } else {
      console.warn('SMTP not configured — skip sending reset email. Set SMTP_HOST, SMTP_USER and SMTP_PASS to enable email delivery.');
    }
    // For testing you can return OTP if SHOW_RESET_TOKEN=true
    if (process.env.SHOW_RESET_TOKEN === 'true') return { message: 'Reset OTP generated', otp: otpCode };
    return { message: 'Mã OTP đã được gửi qua email' };
  }

  async resetPassword(otp: string, newPassword: string) {
    console.log('🔍 Looking for OTP:', otp);
    
    const record = await this.passwordResetRepo.findOne({ where: { token: otp } });
    if (!record) {
      console.log('❌ OTP not found in database');
      throw new NotFoundException('Mã OTP không hợp lệ');
    }
    
    if (record.expires_at < new Date()) {
      console.log('❌ OTP expired');
      throw new UnauthorizedException('Mã OTP đã hết hạn');
    }
    
    const user = await this.usersService.findById(record.user_id);
    if (!user) {
      console.log('❌ User not found');
      throw new NotFoundException('Người dùng không tồn tại');
    }
    
    console.log('✅ OTP valid, updating password for user:', user.email);
    const hash = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.user_id, hash);
    
    // Remove used OTP
    await this.passwordResetRepo.delete(record.id);
    console.log('✅ Password updated successfully');
    
    return { message: 'Đặt lại mật khẩu thành công' };
  }

  async findByEmail(email: string) {
    return this.usersService.findByEmail(email);
  }

  async updateProfile(userId: number, updateData: any) {
    const allowedFields = ['full_name', 'phone', 'address'];
    const filteredData = {};
    
    // Only allow updating specific fields
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      throw new BadRequestException('No valid fields to update');
    }

    return this.usersService.updateProfile(userId, filteredData);
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    // Get user by ID
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    // Check if new password is different from old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (isSamePassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }

    // Hash new password and update
    const hash = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(userId, hash);

    return { message: 'Thay đổi mật khẩu thành công' };
  }

  async verifyOtpOnly(otp: string) {
    console.log('🔍 Verifying OTP only:', otp);
    const record = await this.passwordResetRepo.findOne({
      where: { token: otp }
    });

    if (!record) {
      console.log('❌ OTP not found in database');
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    console.log('✅ OTP found, checking expiry...');
    if (record.expires_at < new Date()) {
      console.log('❌ OTP expired');
      throw new BadRequestException('Mã OTP đã hết hạn');
    }

    const user = await this.usersService.findById(record.user_id);
    if (!user) {
      console.log(' User not found for OTP');
      throw new NotFoundException('User not found');
    }
    
    console.log(' OTP valid for user:', user.email);
    
    return { 
      message: 'Mã OTP hợp lệ', 
      isValid: true,
      email: user.email
    };
  }
}
