import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminRole } from './admin-role.entity';

@Injectable()
export class AdminRoleService {
  constructor(
    @InjectRepository(AdminRole)
    private readonly adminRoleRepository: Repository<AdminRole>,
  ) {}

  async findAll(): Promise<AdminRole[]> {
    return this.adminRoleRepository.find({
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<AdminRole | null> {
    return this.adminRoleRepository.findOne({ where: { id } });
  }

  async findByName(roleName: string): Promise<AdminRole | null> {
    return this.adminRoleRepository.findOne({ where: { role_name: roleName } });
  }
}

