import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
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
    const payload = { sub: user.user_id, email: user.email, role: user.role };
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
    const user = await this.usersService.create({
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
    const token = randomBytes(16).toString('hex'); // longer token for email link
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes
    const record = this.passwordResetRepo.create({ user_id: user.user_id, token, expires_at: expiresAt });
    await this.passwordResetRepo.save(record);
    // send email via nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    const resetLink = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/auth/reset-password?token=${token}`;
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: user.email,
      subject: 'Password reset',
      text: `You requested a password reset. Use this token or click the link: ${token}\n${resetLink}`,
    };
    try {
      await transporter.sendMail(mailOptions);
    } catch (err) {
      // log but don't fail the request
      console.error('Failed to send reset email', err);
    }
    // For testing you can return token if SHOW_RESET_TOKEN=true
    if (process.env.SHOW_RESET_TOKEN === 'true') return { message: 'Reset token generated', token };
    return { message: 'Reset email sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await this.passwordResetRepo.findOne({ where: { token } });
    if (!record) throw new NotFoundException('Invalid token');
    if (record.expires_at < new Date()) throw new UnauthorizedException('Token expired');
    const user = await this.usersService.findById(record.user_id);
    if (!user) throw new NotFoundException('User not found');
  const hash = await bcrypt.hash(newPassword, 10);
  await this.usersService.updatePassword(user.user_id, hash);
    // optionally remove token
    await this.passwordResetRepo.delete(record.id);
    return { message: 'Password reset successful' };
  }

  // Find or create user from Google profile
  async findOrCreateFromGoogle({ email, googleId, profile }: any) {
    let user: import('../entities/user.entity').User | null = null;
    if (googleId) user = await this.usersService.findByGoogleId(googleId);
    if (!user && email) user = await this.usersService.findByEmail(email);
    if (!user) {
      user = await this.usersService.create({
        email,
        full_name: profile?.displayName,
        google_id: googleId,
        is_active: true,
      });
    } else if (!user.google_id && googleId) {
      // link existing account
      await this.usersService.linkGoogleId(user.user_id, googleId);
      user = await this.usersService.findById(user.user_id);
    }
    return user!;
  }
}
