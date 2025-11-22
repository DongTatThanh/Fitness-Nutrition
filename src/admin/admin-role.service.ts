import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminRole } from './admin-role.entity';

@Injectable()
export class AdminRoleService {
  constructor(
    @InjectRepository(AdminRole)
    private roleRepo: Repository<AdminRole>,
  ) {}

  /**
   * Lấy tất cả roles
   */
  async findAll() {
    return this.roleRepo.find({
      where: { is_active: 1 },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Lấy role theo ID
   */
  async findById(id: number) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role không tồn tại');
    }
    return role;
  }

  /**
   * Lấy role theo tên
   */
  async findByName(roleName: string) {
    return this.roleRepo.findOne({ where: { role_name: roleName } });
  }

  /**
   * Tạo role mới
   */
  async create(roleData: {
    role_name: string;
    permissions?: any;
    description?: string;
  }) {
    const role = this.roleRepo.create({
      ...roleData,
      is_active: 1,
    });
    return this.roleRepo.save(role);
  }

  /**
   * Cập nhật role
   */
  async update(id: number, updateData: {
    role_name?: string;
    permissions?: any;
    description?: string;
    is_active?: number;
  }) {
    const role = await this.findById(id);
    Object.assign(role, updateData);
    return this.roleRepo.save(role);
  }

  /**
   * Xóa role
   */
  async delete(id: number) {
    const role = await this.findById(id);
    await this.roleRepo.remove(role);
    return { message: 'Xóa role thành công' };
  }
}

