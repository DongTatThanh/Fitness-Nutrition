import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './banner.entity';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private bannersRepository: Repository<Banner>,
  ) {}

  // Lấy tất cả banner đang active
  async findAllBanners(): Promise<Banner[]> {
    return await this.bannersRepository.find({
      where: { is_active: true },
      order: {
        position: 'ASC',
        sort_order: 'ASC',
      },
    });
  }

  // Lấy banner theo vị trí (header=1, sidebar=2, footer=3)
  async findBannersByPosition(position: number): Promise<Banner[]> {
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
  async findBannerById(id: number): Promise<Banner | null> {
    return await this.bannersRepository.findOne({
      where: { id },
    });
  }

  // Tạo banner mới
  async createBanner(bannerData: Partial<Banner>): Promise<Banner> {
v    const banner = this.bannersRepository.create(bannerData);
    return await this.bannersRepository.save(banner);
  }

  // Cập nhật banner
  async updateBanner(id: number, bannerData: Partial<Banner>): Promise<Banner | null> {
  if (!bannerData || Object.keys(bannerData).length === 0) {
    throw new BadRequestException('No banner data provided for update');
  }

  delete (bannerData as any).created_at;
  delete (bannerData as any).created_by;

  await this.bannersRepository.update(id, {
    ...bannerData,
    updated_at: new Date(),
  });

  return this.findBannerById(id);
}

  // xóa banner
  async deleteBanner(id: number): Promise<void> {
    await this.bannersRepository.delete(id);
  }

}