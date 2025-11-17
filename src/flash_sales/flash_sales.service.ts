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
      relations: [
        'items', 
        'items.product', 
        'items.product.brand', 
        'items.product.category',
        'items.variant', // Load variant nếu có
      ],
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

  /**
   * Kiểm tra sản phẩm có trong flash sale đang active không và lấy giá
   * @param productId - ID sản phẩm
   * @param variantId - ID variant (optional)
   * @returns Giá flash sale nếu có, null nếu không
   */
  async getFlashSalePrice(productId: number, variantId?: number): Promise<{
    sale_price: number;
    original_price: number;
    flash_sale_id: number;
    flash_sale_item_id: number;
  } | null> {
    const now = new Date();

    // Tìm flash sale đang active
    const flashSale = await this.flashSalesRepository.findOne({
      where: {
        is_active: true,
        start_time: LessThanOrEqual(now),
        end_time: MoreThanOrEqual(now),
      },
      relations: ['items'],
    });

    if (!flashSale) {
      return null;
    }

    // Tìm sản phẩm trong flash sale
    const whereCondition: any = {
      flash_sale_id: flashSale.id,
      product_id: productId,
    };

    if (variantId) {
      whereCondition.variant_id = variantId;
    } else {
      whereCondition.variant_id = null;
    }

    const flashSaleItem = await this.flashSaleProductsRepository.findOne({
      where: whereCondition,
    });

    if (!flashSaleItem) {
      return null;
    }

    // Kiểm tra còn hàng không (nếu có max_quantity)
    if (flashSaleItem.max_quantity && flashSaleItem.sold_quantity >= flashSaleItem.max_quantity) {
      return null; // Hết hàng flash sale
    }

    return {
      sale_price: Number(flashSaleItem.sale_price),
      original_price: Number(flashSaleItem.original_price),
      flash_sale_id: flashSale.id,
      flash_sale_item_id: flashSaleItem.id,
    };
  }
}