import { Controller, Post, Body, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Get, Req, UseGuards, Put } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() dto: any) {
    console.log('📥 RAW Register request body:', dto);
    console.log('📊 RAW Data types:', {
      email: typeof dto.email,
      password: typeof dto.password,
      full_name: typeof dto.full_name
    });
    console.log('📋 RAW Data values:', {
      email: dto.email,
      password: dto.password?.length ? `[${dto.password.length} chars]` : 'empty/undefined',
      full_name: dto.full_name
    });
    console.log('📄 Full request object keys:', Object.keys(dto));

    // Convert to proper DTO for service
    const registerDto = new RegisterDto();
    registerDto.email = dto.email;
    registerDto.password = dto.password;
    registerDto.full_name = dto.full_name;
    
    return this.authService.register(registerDto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    console.log('📥 Reset password request:', { otp: dto.otp, passwordLength: dto.newPassword?.length });
    
    if (!dto.otp || !dto.newPassword) {
      throw new BadRequestException('Mã OTP và mật khẩu mới là bắt buộc');
    }
    return this.authService.resetPassword(dto.otp, dto.newPassword);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: any) {
    console.log('📥 Verify OTP only request:', { otp: dto.otp, email: dto.email });
    
    if (!dto.otp) {
      throw new BadRequestException('Mã OTP là bắt buộc');
    }
    
    // Chỉ kiểm tra OTP, không reset password
    return this.authService.verifyOtpOnly(dto.otp);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: any) {
    // In a stateless JWT system, logout is typically handled client-side
    // by removing the token. Server-side could maintain a blacklist if needed.
    return { message: 'Logged out successfully' };
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: any) {
    return req.user;
  }

  @Put('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(@Req() req: any, @Body() updateData: any) {
    // Basic validation
    if (updateData.email && updateData.email !== req.user.email) {
      const existingUser = await this.authService.findByEmail(updateData.email);
      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }
    
    const updatedUser = await this.authService.updateProfile(req.user.user_id, updateData);
    return updatedUser;
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Req() req: any) {
    // `req.user` is populated by JwtStrategy
    return req.user;
  }

  @Put('change-password')
  @UseGuards(AuthGuard('jwt'))
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    if (!dto.oldPassword || !dto.newPassword) {
      throw new BadRequestException('Mật khẩu hiện tại và mật khẩu mới là bắt buộc');
    }

    return this.authService.changePassword(req.user.user_id, dto.oldPassword, dto.newPassword);
  }
}
