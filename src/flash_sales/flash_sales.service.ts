import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, LessThan, MoreThan } from 'typeorm';
import { FlashSale } from './flash-sale.entity';
import { FlashSaleProduct } from './flash-sale-product.entity';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';
import { CreateFlashSaleDto, UpdateFlashSaleDto, AddProductToFlashSaleDto, UpdateFlashSaleProductDto } from './dto/flash-sale.dto';

@Injectable()
export class FlashSalesService {
  constructor(
    @InjectRepository(FlashSale)
    private flashSalesRepository: Repository<FlashSale>,
    @InjectRepository(FlashSaleProduct)
    private flashSaleProductsRepository: Repository<FlashSaleProduct>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantsRepository: Repository<ProductVariant>,
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

  // ============== ADMIN METHODS ==============

  // Lấy tất cả Flash Sales với phân trang và filter
  async getAllFlashSales(page: number = 1, limit: number = 20, status?: string) {
    const now = new Date();
    const query = this.flashSalesRepository.createQueryBuilder('fs')
      .leftJoinAndSelect('fs.items', 'items')
      .orderBy('fs.start_time', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // Filter theo status
    if (status === 'active') {
      query.andWhere('fs.is_active = :is_active', { is_active: true })
        .andWhere('fs.start_time <= :now', { now })
        .andWhere('fs.end_time >= :now', { now });
    } else if (status === 'upcoming') {
      query.andWhere('fs.start_time > :now', { now });
    } else if (status === 'expired') {
      query.andWhere('fs.end_time < :now', { now });
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data: data.map(fs => ({
        ...fs,
        product_count: fs.items?.length || 0,
        status: this.getFlashSaleStatus(fs),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Lấy chi tiết Flash Sale
  async getFlashSaleById(id: number) {
    const flashSale = await this.flashSalesRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'items.variant'],
    });

    if (!flashSale) {
      throw new NotFoundException(`Flash Sale với ID ${id} không tồn tại`);
    }

    return {
      ...flashSale,
      status: this.getFlashSaleStatus(flashSale),
      product_count: flashSale.items?.length || 0,
    };
  }

  // Tạo Flash Sale mới
  async createFlashSale(dto: CreateFlashSaleDto) {
    // Validate thời gian
    const startTime = new Date(dto.start_time);
    const endTime = new Date(dto.end_time);

    if (endTime <= startTime) {
      throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
    }

    const flashSale = this.flashSalesRepository.create({
      name: dto.name,
      description: dto.description,
      start_time: startTime,
      end_time: endTime,
      is_active: dto.is_active !== undefined ? dto.is_active : true,
    });

    const saved = await this.flashSalesRepository.save(flashSale);

    return {
      success: true,
      message: 'Tạo Flash Sale thành công',
      data: saved,
    };
  }

  // Cập nhật Flash Sale
  async updateFlashSale(id: number, dto: UpdateFlashSaleDto) {
    const flashSale = await this.flashSalesRepository.findOne({ where: { id } });

    if (!flashSale) {
      throw new NotFoundException(`Flash Sale với ID ${id} không tồn tại`);
    }

    // Validate thời gian nếu có update
    if (dto.start_time || dto.end_time) {
      const startTime = dto.start_time ? new Date(dto.start_time) : flashSale.start_time;
      const endTime = dto.end_time ? new Date(dto.end_time) : flashSale.end_time;

      if (endTime <= startTime) {
        throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
      }

      if (dto.start_time) flashSale.start_time = startTime;
      if (dto.end_time) flashSale.end_time = endTime;
    }

    if (dto.name) flashSale.name = dto.name;
    if (dto.description !== undefined) flashSale.description = dto.description;
    if (dto.is_active !== undefined) flashSale.is_active = dto.is_active;

    const updated = await this.flashSalesRepository.save(flashSale);

    return {
      success: true,
      message: 'Cập nhật Flash Sale thành công',
      data: updated,
    };
  }

  // Xóa Flash Sale
  async deleteFlashSale(id: number) {
    const flashSale = await this.flashSalesRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!flashSale) {
      throw new NotFoundException(`Flash Sale với ID ${id} không tồn tại`);
    }

    // Xóa tất cả items trước
    if (flashSale.items && flashSale.items.length > 0) {
      await this.flashSaleProductsRepository.delete({ flash_sale_id: id });
    }

    await this.flashSalesRepository.delete(id);

    return {
      success: true,
      message: 'Xóa Flash Sale thành công',
    };
  }

  // Thêm sản phẩm vào Flash Sale
  async addProductToFlashSale(flashSaleId: number, dto: AddProductToFlashSaleDto) {
    // Kiểm tra Flash Sale tồn tại
    const flashSale = await this.flashSalesRepository.findOne({ where: { id: flashSaleId } });
    if (!flashSale) {
      throw new NotFoundException(`Flash Sale với ID ${flashSaleId} không tồn tại`);
    }

    // Kiểm tra sản phẩm tồn tại
    const product = await this.productsRepository.findOne({ where: { id: dto.product_id } });
    if (!product) {
      throw new NotFoundException(`Sản phẩm với ID ${dto.product_id} không tồn tại`);
    }

    // Nếu có variant_id, kiểm tra variant tồn tại
    if (dto.variant_id) {
      const variant = await this.variantsRepository.findOne({ where: { id: dto.variant_id } });
      if (!variant) {
        throw new NotFoundException(`Variant với ID ${dto.variant_id} không tồn tại`);
      }
    }

    // Kiểm tra sản phẩm đã tồn tại trong Flash Sale chưa
    const whereCondition: any = {
      flash_sale_id: flashSaleId,
      product_id: dto.product_id,
    };
    
    if (dto.variant_id) {
      whereCondition.variant_id = dto.variant_id;
    } else {
      whereCondition.variant_id = null;
    }

    const existing = await this.flashSaleProductsRepository.findOne({
      where: whereCondition,
    });

    if (existing) {
      throw new BadRequestException('Sản phẩm này đã có trong Flash Sale');
    }

    // Lấy original_price từ product hoặc variant nếu không được cung cấp
    let originalPrice = dto.original_price;
    if (!originalPrice) {
      if (dto.variant_id) {
        const variant = await this.variantsRepository.findOne({ where: { id: dto.variant_id } });
        if (variant) {
          originalPrice = Number(variant.compare_price || variant.price);
        } else {
          originalPrice = Number(product.compare_price || product.price);
        }
      } else {
        originalPrice = Number(product.compare_price || product.price);
      }
    }

    const flashSaleProduct = this.flashSaleProductsRepository.create({
      flash_sale_id: flashSaleId,
      product_id: dto.product_id,
      variant_id: dto.variant_id,
      original_price: originalPrice,
      sale_price: dto.sale_price,
      max_quantity: dto.max_quantity,
      sold_quantity: 0,
    });

    const saved = await this.flashSaleProductsRepository.save(flashSaleProduct);

    return {
      success: true,
      message: 'Thêm sản phẩm vào Flash Sale thành công',
      data: saved,
    };
  }

  // Thêm nhiều sản phẩm vào Flash Sale (bulk)
  async bulkAddProducts(flashSaleId: number, products: AddProductToFlashSaleDto[]) {
    const results: any[] = [];
    const errors: any[] = [];

    for (const product of products) {
      try {
        const result = await this.addProductToFlashSale(flashSaleId, product);
        results.push(result.data);
      } catch (error) {
        errors.push({
          product_id: product.product_id,
          variant_id: product.variant_id,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      message: `Đã thêm ${results.length}/${products.length} sản phẩm`,
      data: {
        added: results,
        errors: errors,
      },
    };
  }

  // Cập nhật sản phẩm trong Flash Sale
  async updateFlashSaleProduct(flashSaleId: number, itemId: number, dto: UpdateFlashSaleProductDto) {
    const item = await this.flashSaleProductsRepository.findOne({
      where: { id: itemId, flash_sale_id: flashSaleId },
    });

    if (!item) {
      throw new NotFoundException(`Sản phẩm Flash Sale với ID ${itemId} không tồn tại`);
    }

    if (dto.sale_price !== undefined) item.sale_price = dto.sale_price;
    if (dto.original_price !== undefined) item.original_price = dto.original_price;
    if (dto.max_quantity !== undefined) item.max_quantity = dto.max_quantity;

    const updated = await this.flashSaleProductsRepository.save(item);

    return {
      success: true,
      message: 'Cập nhật sản phẩm Flash Sale thành công',
      data: updated,
    };
  }

  // Xóa sản phẩm khỏi Flash Sale
  async removeProductFromFlashSale(flashSaleId: number, itemId: number) {
    const item = await this.flashSaleProductsRepository.findOne({
      where: { id: itemId, flash_sale_id: flashSaleId },
    });

    if (!item) {
      throw new NotFoundException(`Sản phẩm Flash Sale với ID ${itemId} không tồn tại`);
    }

    await this.flashSaleProductsRepository.delete(itemId);

    return {
      success: true,
      message: 'Xóa sản phẩm khỏi Flash Sale thành công',
    };
  }

  // Lấy danh sách sản phẩm trong Flash Sale
  async getFlashSaleProducts(flashSaleId: number, page: number = 1, limit: number = 20) {
    const [items, total] = await this.flashSaleProductsRepository.findAndCount({
      where: { flash_sale_id: flashSaleId },
      relations: ['product', 'product.brand', 'product.category', 'variant'],
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: items.map(item => ({
        id: item.id,
        product: item.product,
        variant: item.variant,
        original_price: Number(item.original_price),
        sale_price: Number(item.sale_price),
        discount_percent: this.calculateDiscountPercent(Number(item.original_price), Number(item.sale_price)),
        max_quantity: item.max_quantity,
        sold_quantity: item.sold_quantity,
        remaining: item.max_quantity ? item.max_quantity - item.sold_quantity : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Helper: Xác định status của Flash Sale
  private getFlashSaleStatus(flashSale: FlashSale): 'upcoming' | 'active' | 'expired' {
    const now = new Date();
    const start = new Date(flashSale.start_time);
    const end = new Date(flashSale.end_time);

    if (now < start) return 'upcoming';
    if (now > end) return 'expired';
    return 'active';
  }
}