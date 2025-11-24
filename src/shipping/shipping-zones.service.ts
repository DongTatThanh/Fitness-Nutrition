import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingZone } from './shipping-zone.entity';
import { CreateShippingZoneDto } from './dto/create-shipping-zone.dto';

@Injectable()
export class ShippingZonesService {
  constructor(
    @InjectRepository(ShippingZone)
    private zonesRepository: Repository<ShippingZone>,
  ) {}

  async findAll(page: number = 1, limit: number = 20, isActive?: boolean) {
    try {
      const query = this.zonesRepository.createQueryBuilder('zone');

      if (isActive !== undefined) {
        query.where('zone.is_active = :isActive', { isActive: isActive ? 1 : 0 });
      }

      query
        .orderBy('zone.created_at', 'DESC')
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
    const zone = await this.zonesRepository.findOne({ where: { id } });

    if (!zone) {
      throw new NotFoundException(`Khu vực với ID ${id} không tồn tại`);
    }

    return zone;
  }

  async findByCode(code: string) {
    return this.zonesRepository.findOne({ where: { code } });
  }

  // Tìm zone dựa trên địa chỉ (city, district)
  async findZoneByAddress(city?: string, district?: string) {
    try {
      const zones = await this.zonesRepository.find({
        where: { is_active: 1 },
      });

    for (const zone of zones) {
      // Kiểm tra city
      if (city && zone.provinces) {
        const provinces = Array.isArray(zone.provinces) ? zone.provinces : [];
        if (provinces.includes(city)) {
          // Nếu có district, kiểm tra thêm
          if (district && zone.districts) {
            const districts = Array.isArray(zone.districts) ? zone.districts : [];
            if (districts.includes(district)) {
              return zone;
            }
          } else {
            return zone;
          }
        }
      }
    }

      // Nếu không tìm thấy, trả về zone mặc định (nếu có)
      return zones.find((z) => z.code === 'default') || null;
    } catch (error) {
      // Nếu bảng chưa tồn tại, trả về null
      if (error.message && error.message.includes("doesn't exist")) {
        return null;
      }
      throw error;
    }
  }

  async create(dto: CreateShippingZoneDto) {
    const zone = this.zonesRepository.create(dto);
    const saved = await this.zonesRepository.save(zone);

    return {
      success: true,
      message: 'Tạo khu vực vận chuyển thành công',
      data: saved,
    };
  }

  async update(id: number, dto: Partial<CreateShippingZoneDto>) {
    const zone = await this.zonesRepository.findOne({ where: { id } });

    if (!zone) {
      throw new NotFoundException(`Khu vực với ID ${id} không tồn tại`);
    }

    Object.assign(zone, dto);
    const updated = await this.zonesRepository.save(zone);

    return {
      success: true,
      message: 'Cập nhật khu vực vận chuyển thành công',
      data: updated,
    };
  }

  async remove(id: number) {
    const zone = await this.zonesRepository.findOne({ where: { id } });

    if (!zone) {
      throw new NotFoundException(`Khu vực với ID ${id} không tồn tại`);
    }

    zone.is_active = 0;
    await this.zonesRepository.save(zone);

    return {
      success: true,
      message: 'Xóa khu vực vận chuyển thành công',
    };
  }

  async findActive() {
    try {
      return this.zonesRepository.find({
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

