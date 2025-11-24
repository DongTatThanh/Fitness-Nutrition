import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingCarrier } from './shipping-carrier.entity';
import { CreateShippingCarrierDto } from './dto/create-shipping-carrier.dto';
import { UpdateShippingCarrierDto } from './dto/update-shipping-carrier.dto';

@Injectable()
export class ShippingCarriersService {
  constructor(
    @InjectRepository(ShippingCarrier)
    private carriersRepository: Repository<ShippingCarrier>,
  ) {}

  async findAll(page: number = 1, limit: number = 20, isActive?: boolean) {
    try {
      const query = this.carriersRepository.createQueryBuilder('carrier');

      if (isActive !== undefined) {
        query.where('carrier.is_active = :isActive', { isActive: isActive ? 1 : 0 });
      }

      query
        .orderBy('carrier.created_at', 'DESC')
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
    } catch (error) {
      // Nếu bảng chưa tồn tại, trả về mảng rỗng
      if (error.message && error.message.includes("doesn't exist")) {
        return {
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }
      throw error;
    }
  }

  async findOne(id: number) {
    const carrier = await this.carriersRepository.findOne({ where: { id } });

    if (!carrier) {
      throw new NotFoundException(`Đơn vị vận chuyển với ID ${id} không tồn tại`);
    }

    return carrier;
  }

  async findByCode(code: string) {
    return this.carriersRepository.findOne({ where: { code } });
  }

  async create(dto: CreateShippingCarrierDto) {
    const carrier = this.carriersRepository.create(dto);
    const saved = await this.carriersRepository.save(carrier);

    return {
      success: true,
      message: 'Tạo đơn vị vận chuyển thành công',
      data: saved,
    };
  }

  async update(id: number, dto: UpdateShippingCarrierDto) {
    const carrier = await this.carriersRepository.findOne({ where: { id } });

    if (!carrier) {
      throw new NotFoundException(`Đơn vị vận chuyển với ID ${id} không tồn tại`);
    }

    Object.assign(carrier, dto);
    const updated = await this.carriersRepository.save(carrier);

    return {
      success: true,
      message: 'Cập nhật đơn vị vận chuyển thành công',
      data: updated,
    };
  }

  async remove(id: number) {
    const carrier = await this.carriersRepository.findOne({ where: { id } });

    if (!carrier) {
      throw new NotFoundException(`Đơn vị vận chuyển với ID ${id} không tồn tại`);
    }

    carrier.is_active = 0;
    await this.carriersRepository.save(carrier);

    return {
      success: true,
      message: 'Xóa đơn vị vận chuyển thành công',
    };
  }

  async findActive() {
    try {
      return this.carriersRepository.find({
        where: { is_active: 1 },
        order: { name: 'ASC' },
      });
    } catch (error) {
      // Nếu bảng chưa tồn tại, trả về mảng rỗng
      if (error.message && error.message.includes("doesn't exist")) {
        return [];
      }
      throw error;
    }
  }
}

