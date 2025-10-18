import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { FlashSale } from './flash-sale.entity';
import { FlashSaleProduct } from './flash-sale-product.entity';

@Injectable()
export class FlashSalesService {
  constructor(
    @InjectRepository(FlashSale)
    private flashSalesRepository: Repository<FlashSale>,
    @InjectRepository(FlashSaleProduct)
    private flashSaleProductsRepository: Repository<FlashSaleProduct>,
  ) {}

  // Lấy Flash Sale đang active
  async findActiveFlashSale(): Promise<FlashSale | null> {
    const now = new Date();

    const flashSale = await this.flashSalesRepository.findOne({
      where: {
        is_active: true,
        start_time: LessThanOrEqual(now),
        end_time: MoreThanOrEqual(now),
      },
      relations: ['items', 'items.product', 'items.product.brand', 'items.product.category'],
      order: { start_time: 'DESC' },
    });

    

    return flashSale;
  }


  // Tính giá Flash Sale
  calculateFlashPrice(originalPrice: number, salePrice: number): number {
    return salePrice;
  }

  // Tính % giảm giá
  calculateDiscountPercent(originalPrice: number, salePrice: number): number 
  {
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  }
}