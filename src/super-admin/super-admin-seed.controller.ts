import { Controller, Post, Body, BadRequestException, ConflictException } from '@nestjs/common';
import { AdminService } from '../admin/admin.service';
import * as bcrypt from 'bcryptjs';
import { AdminLoginDto } from '../admin/dto/admin-login.dto';

/**
 * Controller đặc biệt để tạo Super Admin đầu tiên
 * Chỉ sử dụng khi chưa có Super Admin nào trong hệ thống
 * Sau khi tạo xong, nên xóa hoặc vô hiệu hóa controller này
 */
@Controller('super-admin/seed')
export class SuperAdminSeedController {
  constructor(private adminService: AdminService) {}

  /**
   * Tạo Super Admin đầu tiên
   * POST /super-admin/seed/create-first
   * 
   * LƯU Ý: Endpoint này chỉ nên được sử dụng một lần để tạo Super Admin đầu tiên
   * Sau đó nên xóa hoặc bảo vệ endpoint này
   */
  @Post('create-first')
  async createFirstSuperAdmin(@Body() dto: AdminLoginDto & { full_name?: string }) {
    // Kiểm tra xem đã có Super Admin chưa
    const allAdmins = await this.adminService.findAll();
    const hasSuperAdmin = allAdmins.some(admin => admin.role === 'super_admin');

    if (hasSuperAdmin) {
      throw new ConflictException('Đã tồn tại Super Admin trong hệ thống. Không thể tạo thêm');
    }

    // Kiểm tra email đã tồn tại chưa
    const existingAdmin = await this.adminService.findByEmail(dto.email);
    if (existingAdmin) {
      throw new ConflictException('Email đã tồn tại trong hệ thống');
    }

    // Validate password
    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Tạo Super Admin
    const superAdmin = await this.adminService.create({
      email: dto.email,
      password_hash: passwordHash,
      full_name: dto.full_name || 'Super Administrator',
      role: 'super_admin',
      is_active: 1,
    });

    return {
      message: 'Đã tạo Super Admin thành công',
      email: superAdmin.email,
      full_name: superAdmin.full_name,
      warning: 'Hãy đổi mật khẩu sau khi đăng nhập và xóa/vô hiệu hóa endpoint này',
    };
  }
}

