import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Menus } from './Menus.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menus)
    private menuRepository: Repository<Menus>,
  ) {}

  // Lấy tất cả menu active
  async findAllMenus(): Promise<Menus[]> {
    return await this.menuRepository.find({
      where: { is_active: 1 },
      order: { created_at: 'DESC' },
    });
  }
}
