import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private suppliersRepository: Repository<Supplier>,
  ) {}

  // Lấy danh sách nhà cung cấp
  async findAll(page: number = 1, limit: number = 20, isActive?: boolean) {
    const query = this.suppliersRepository.createQueryBuilder('supplier');

    if (isActive !== undefined) {
      query.where('supplier.is_active = :isActive', { isActive: isActive ? 1 : 0 });
    }

    query
      .orderBy('supplier.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Lấy chi tiết nhà cung cấp
  async findOne(id: number) {
    const supplier = await this.suppliersRepository.findOne({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException(`Nhà cung cấp với ID ${id} không tồn tại`);
    }

    return supplier;
  }

  // Tạo nhà cung cấp mới
  async create(createSupplierDto: CreateSupplierDto) {
    const supplier = this.suppliersRepository.create(createSupplierDto);
    const saved = await this.suppliersRepository.save(supplier);

    return {
      success: true,
      message: 'Tạo nhà cung cấp thành công',
      data: saved,
    };
  }

  // Cập nhật nhà cung cấp
  async update(id: number, updateSupplierDto: UpdateSupplierDto) {
    const supplier = await this.suppliersRepository.findOne({ where: { id } });

    if (!supplier) {
      throw new NotFoundException(`Nhà cung cấp với ID ${id} không tồn tại`);
    }

    Object.assign(supplier, updateSupplierDto);
    const updated = await this.suppliersRepository.save(supplier);

    return {
      success: true,
      message: 'Cập nhật nhà cung cấp thành công',
      data: updated,
    };
  }

  // Xóa nhà cung cấp (soft delete - set is_active = 0)
  async remove(id: number) {
    const supplier = await this.suppliersRepository.findOne({ where: { id } });

    if (!supplier) {
      throw new NotFoundException(`Nhà cung cấp với ID ${id} không tồn tại`);
    }

    supplier.is_active = 0;
    await this.suppliersRepository.save(supplier);

    return {
      success: true,
      message: 'Xóa nhà cung cấp thành công',
    };
  }

  // Lấy tất cả nhà cung cấp đang hoạt động (cho dropdown)
  async findActive() {
    return this.suppliersRepository.find({
      where: { is_active: 1 },
      order: { name: 'ASC' },
    });
  }
}

