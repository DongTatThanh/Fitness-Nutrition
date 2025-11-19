import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Banner } from './banner.entity';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private bannersRepository: Repository<Banner>,
  ) {}

  // ============== PUBLIC METHODS ==============

  // Lấy tất cả banner đang active (public)
  async findAllBanners(): Promise<Banner[]> {
    const now = new Date();
    return await this.bannersRepository.find({
      where: { is_active: true },
      order: {
        position: 'ASC',
        sort_order: 'ASC',
      },
    });
  }

  // Lấy banner theo vị trí (public)
  async findBannersByPosition(position: number): Promise<Banner[]> {
    const now = new Date();
    return await this.bannersRepository.find({
      where: {
        is_active: true,
        position: position,
      },
      order: {
        sort_order: 'ASC',
      },
    });
  }

  // Lấy banner theo ID
  async findBannerById(id: number): Promise<Banner> {
    const banner = await this.bannersRepository.findOne({
      where: { id },
    });

    if (!banner) {
      throw new NotFoundException(`Banner với ID ${id} không tồn tại`);
    }

    return banner;
  }

  // ============== ADMIN METHODS ==============

  // Lấy danh sách banner cho admin (có phân trang và filter)
  async getAdminBanners(
    page: number = 1,
    limit: number = 20,
    position?: number,
    is_active?: boolean,
  ) {
    const query = this.bannersRepository.createQueryBuilder('banner');

    // Filter theo position
    if (position !== undefined) {
      query.andWhere('banner.position = :position', { position });
    }

    // Filter theo is_active
    if (is_active !== undefined) {
      query.andWhere('banner.is_active = :is_active', { is_active });
    }

    // Sắp xếp
    query.orderBy('banner.position', 'ASC')
      .addOrderBy('banner.sort_order', 'ASC')
      .addOrderBy('banner.created_at', 'DESC');

    // Phân trang
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Tạo banner mới
  async createBanner(createBannerDto: CreateBannerDto & { image_url: string }) {
    const banner = this.bannersRepository.create({
      ...createBannerDto,
      is_active: createBannerDto.is_active ?? true,
      sort_order: createBannerDto.sort_order ?? 0,
      link_target: createBannerDto.link_target ?? '_self',
    });

    const saved = await this.bannersRepository.save(banner);

    return {
      success: true,
      message: 'Tạo banner thành công',
      data: saved,
    };
  }

  // Cập nhật banner
  async updateBanner(id: number, updateBannerDto: UpdateBannerDto) {
    const banner = await this.findBannerById(id);

    if (!updateBannerDto || Object.keys(updateBannerDto).length === 0) {
      throw new BadRequestException('Không có dữ liệu cập nhật');
    }

    // Không cho phép cập nhật created_at, created_by
    delete (updateBannerDto as any).created_at;
    delete (updateBannerDto as any).created_by;

    await this.bannersRepository.update(id, {
      ...updateBannerDto,
      updated_at: new Date(),
    });

    const updated = await this.findBannerById(id);

    return {
      success: true,
      message: 'Cập nhật banner thành công',
      data: updated,
    };
  }

  // Xóa banner
  async deleteBanner(id: number): Promise<void> {
    const banner = await this.findBannerById(id);
    await this.bannersRepository.delete(id);
  }

  // Bật/tắt trạng thái banner
  async toggleActive(id: number) {
    const banner = await this.findBannerById(id);
    
    banner.is_active = !banner.is_active;
    const updated = await this.bannersRepository.save(banner);

    return {
      success: true,
      message: `Banner đã ${updated.is_active ? 'bật' : 'tắt'}`,
      data: updated,
    };
  }
}