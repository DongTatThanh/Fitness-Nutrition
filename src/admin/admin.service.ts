import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin } from './admin.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepo: Repository<Admin>,
  ) {}

  findByEmail(email: string): Promise<Admin | null> {
    return this.adminRepo.findOne({ where: { email } });
  }

  findById(id: number): Promise<Admin | null> {
    return this.adminRepo.findOne({ where: { admin_id: id } });
  }

  create(admin: Partial<Admin>): Promise<Admin> {
    const a = this.adminRepo.create(admin as any);
    return this.adminRepo.save(a).then((res: any) => (Array.isArray(res) ? res[0] : res));
  }

  updatePassword(adminId: number, password_hash: string) {
    return this.adminRepo.update({ admin_id: adminId }, { password_hash });
  }

  async updateProfile(adminId: number, updateData: any): Promise<Admin> {
    await this.adminRepo.update({ admin_id: adminId }, updateData);
    const admin = await this.findById(adminId);
    if (!admin) throw new Error('Admin not found after update');
    return admin;
  }

  findAll(): Promise<Admin[]> {
    return this.adminRepo.find({
      order: { created_at: 'DESC' },
    });
  }

  async delete(adminId: number): Promise<void> {
    const result = await this.adminRepo.delete({ admin_id: adminId });
    if (result.affected === 0) {
      throw new Error('Admin not found');
    }
  }
}

