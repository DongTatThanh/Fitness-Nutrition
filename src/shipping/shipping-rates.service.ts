import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingRate } from './shipping-rate.entity';
import { CreateShippingRateDto } from './dto/create-shipping-rate.dto';

@Injectable()
export class ShippingRatesService {
  constructor(
    @InjectRepository(ShippingRate)
    private ratesRepository: Repository<ShippingRate>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 20,
    carrierId?: number,
    zoneId?: number,
  ) {
    try {
      const query = this.ratesRepository
        .createQueryBuilder('rate')
        .leftJoinAndSelect('rate.carrier', 'carrier')
        .leftJoinAndSelect('rate.zone', 'zone');

      if (carrierId) {
        query.andWhere('rate.carrier_id = :carrierId', { carrierId });
      }

      if (zoneId) {
        query.andWhere('rate.zone_id = :zoneId', { zoneId });
      }

      query
        .andWhere('rate.is_active = 1')
        .orderBy('rate.priority', 'ASC')
        .addOrderBy('rate.created_at', 'DESC')
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
    const rate = await this.ratesRepository.findOne({
      where: { id },
      relations: ['carrier', 'zone'],
    });

    if (!rate) {
      throw new NotFoundException(`Bảng giá với ID ${id} không tồn tại`);
    }

    return rate;
  }

  // Tìm rate phù hợp dựa trên carrier, zone và weight
  async findRate(carrierId: number, zoneId: number, weight: number) {
    try {
      const rates = await this.ratesRepository.find({
        where: {
          carrier_id: carrierId,
          zone_id: zoneId,
          is_active: 1,
        },
        relations: ['carrier', 'zone'],
        order: { priority: 'ASC' },
      });

    // Tìm rate phù hợp với weight
    for (const rate of rates) {
      const minWeight = Number(rate.min_weight) || 0;
      const maxWeight = rate.max_weight ? Number(rate.max_weight) : Infinity;

      if (weight >= minWeight && weight <= maxWeight) {
        return rate;
      }
      }

      return null;
    } catch (error) {
      // Nếu bảng chưa tồn tại, trả về null
      if (error.message && error.message.includes("doesn't exist")) {
        return null;
      }
      throw error;
    }
  }

  async create(dto: CreateShippingRateDto) {
    // Validate weight range
    if (dto.max_weight && dto.min_weight && dto.max_weight <= dto.min_weight) {
      throw new BadRequestException(
        'Trọng lượng tối đa phải lớn hơn trọng lượng tối thiểu',
      );
    }

    const rate = this.ratesRepository.create(dto);
    const saved = await this.ratesRepository.save(rate);

    return {
      success: true,
      message: 'Tạo bảng giá vận chuyển thành công',
      data: saved,
    };
  }

  async update(id: number, dto: Partial<CreateShippingRateDto>) {
    const rate = await this.ratesRepository.findOne({ where: { id } });

    if (!rate) {
      throw new NotFoundException(`Bảng giá với ID ${id} không tồn tại`);
    }

    // Validate weight range
    const maxWeight = dto.max_weight !== undefined ? dto.max_weight : rate.max_weight;
    const minWeight = dto.min_weight !== undefined ? dto.min_weight : rate.min_weight;

    if (maxWeight && minWeight && maxWeight <= minWeight) {
      throw new BadRequestException(
        'Trọng lượng tối đa phải lớn hơn trọng lượng tối thiểu',
      );
    }

    Object.assign(rate, dto);
    const updated = await this.ratesRepository.save(rate);

    return {
      success: true,
      message: 'Cập nhật bảng giá vận chuyển thành công',
      data: updated,
    };
  }

  async remove(id: number) {
    const rate = await this.ratesRepository.findOne({ where: { id } });

    if (!rate) {
      throw new NotFoundException(`Bảng giá với ID ${id} không tồn tại`);
    }

    rate.is_active = 0;
    await this.ratesRepository.save(rate);

    return {
      success: true,
      message: 'Xóa bảng giá vận chuyển thành công',
    };
  }
}

