import { Injectable, ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { AdminService } from '../admin/admin.service';
import * as bcrypt from 'bcryptjs';

import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminRoleDto } from './dto/update-admin-role.dto';
import { UpdateAdminStatusDto } from './dto/update-admin-status.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Injectable()
export class SuperAdminManagementService {
  constructor(
    private adminService: AdminService,
  ) {}

  /**
   * Tạo admin mới (chỉ Super Admin)
   * Chỉ được tạo Admin thường, không được tạo Super Admin
   */
  async createAdmin(adminData: CreateAdminDto, currentAdminId?: number) {
    // Không cho phép tạo Super Admin
    if (adminData.role === 'super_admin') {
      throw new ForbiddenException('Không được phép tạo Super Admin. Super Admin chỉ có thể quản lý Admin thường.');
    }

    // Kiểm tra email đã tồn tại chưa
    const existing = await this.adminService.findByEmail(adminData.email);
    if (existing) {
      throw new ConflictException('Email đã tồn tại trong hệ thống');
    }

    // Hash password
    const hash = await bcrypt.hash(adminData.password, 10);

    // Tạo admin mới (chỉ admin thường)
    const newAdmin = await this.adminService.create({
      email: adminData.email,
      password_hash: hash,
      full_name: adminData.full_name,
      phone: adminData.phone,
      role: 'admin', // Luôn là admin thường, không cho phép super_admin
      is_active: 1,
    });

    return newAdmin;
  }

  /**
   * Lấy danh sách tất cả admin thường (chỉ Super Admin)
   * Không bao gồm Super Admin trong danh sách
   */
  async getAllAdmins() {
    try {
      const allAdmins = await this.adminService.findAll();
      // Chỉ lấy admin thường, loại bỏ Super Admin
      const regularAdmins = allAdmins.filter(admin => admin.role !== 'super_admin');
      return regularAdmins || [];
    } catch (error) {
      throw new BadRequestException(`Lỗi khi lấy danh sách admin: ${error.message}`);
    }
  }

  /**
   * Lấy thông tin chi tiết admin (chỉ Super Admin)
   * Không cho phép xem thông tin Super Admin khác
   */
  async getAdminById(adminId: number) {
    const admin = await this.adminService.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin không tồn tại');
    }
    
    // Không cho phép xem thông tin Super Admin
    if (admin.role === 'super_admin') {
      throw new ForbiddenException('Không được phép xem thông tin Super Admin. Super Admin chỉ có thể quản lý Admin thường.');
    }
    
    return admin;
  }

  /**
   * Cập nhật role của admin (chỉ Super Admin)
   * Không cho phép sửa role của Super Admin
   */
  async updateAdminRole(adminId: number, updateRoleDto: UpdateAdminRoleDto, currentAdminId?: number) {
    const admin = await this.adminService.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin không tồn tại');
    }

    // Không cho phép sửa role của Super Admin
    if (admin.role === 'super_admin') {
      throw new ForbiddenException('Không được phép thay đổi role của Super Admin.');
    }

    // Không cho phép đổi thành Super Admin
    if (updateRoleDto.role === 'super_admin') {
      throw new ForbiddenException('Không được phép đổi role thành Super Admin.');
    }

    const updated = await this.adminService.updateProfile(adminId, { role: updateRoleDto.role });

    return updated;
  }

  /**
   * Cập nhật trạng thái admin (bật/tắt) (chỉ Super Admin)
   * Không cho phép sửa trạng thái của Super Admin
   */
  async updateAdminStatus(adminId: number, updateStatusDto: UpdateAdminStatusDto, currentAdminId?: number) {
    const admin = await this.adminService.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin không tồn tại');
    }

    // Không cho phép sửa trạng thái của Super Admin
    if (admin.role === 'super_admin') {
      throw new ForbiddenException('Không được phép thay đổi trạng thái của Super Admin.');
    }

    const updated = await this.adminService.updateProfile(adminId, { is_active: updateStatusDto.is_active });

    return updated;
  }

  /**
   * Cập nhật thông tin admin (chỉ Super Admin)
   * Không cho phép sửa thông tin Super Admin
   */
  async updateAdmin(adminId: number, updateData: UpdateAdminDto) {
    const admin = await this.adminService.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin không tồn tại');
    }

    // Không cho phép sửa thông tin Super Admin
    if (admin.role === 'super_admin') {
      throw new ForbiddenException('Không được phép sửa thông tin Super Admin.');
    }

    const allowedFields: any = {};
    if (updateData.full_name !== undefined && updateData.full_name !== null) {
      allowedFields.full_name = updateData.full_name;
    }
    if (updateData.phone !== undefined && updateData.phone !== null) {
      allowedFields.phone = updateData.phone;
    }

    if (Object.keys(allowedFields).length === 0) {
      throw new BadRequestException('Phải cập nhật ít nhất một trường: full_name hoặc phone');
    }

    return this.adminService.updateProfile(adminId, allowedFields);
  }

  /**
   * Đổi mật khẩu admin (chỉ Super Admin)
   * Không cho phép đổi mật khẩu Super Admin
   */
  async changeAdminPassword(adminId: number, newPassword: string, currentAdminId?: number) {
    const admin = await this.adminService.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin không tồn tại');
    }

    // Không cho phép đổi mật khẩu Super Admin
    if (admin.role === 'super_admin') {
      throw new ForbiddenException('Không được phép đổi mật khẩu Super Admin.');
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await this.adminService.updatePassword(adminId, hash);

    return { message: 'Đổi mật khẩu thành công' };
  }

  /**
   * Xóa admin (chỉ Super Admin)
   * Không cho phép xóa Super Admin
   */
  async deleteAdmin(adminId: number, currentAdminId?: number) {
    const admin = await this.adminService.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin không tồn tại');
    }

    // Không cho phép xóa Super Admin
    if (admin.role === 'super_admin') {
      throw new ForbiddenException('Không được phép xóa Super Admin.');
    }

    await this.adminService.delete(adminId);
    return { message: 'Xóa admin thành công' };
  }
}