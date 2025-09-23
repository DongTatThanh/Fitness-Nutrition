import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../entities/brand.entity';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private brandRepo: Repository<Brand>
  ) {}

  async findAll(): Promise<Brand[]> {
    return this.brandRepo.find({
      where: { is_active: true },
      order: { name: 'ASC' }
    });
  }
}