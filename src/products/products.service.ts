import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { ProductVariant } from '../entities/product-variant.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(
    @InjectRepository(Product) private repo: Repository<Product>,
    @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>
  ) {}

  async findAll(): Promise<Product[]> {
    try {
      return await this.repo.find({
        relations: ['brand', 'category'],
        where: { is_active: true }
      });
    } catch (err) {
      // table may not exist or other DB issue; log and return empty list for safety
      this.logger.warn('Failed to fetch products — returning empty array. Error: ' + (err?.message || err));
      return [];
    }
  }

  async findById(id: number): Promise<Product> {
    const product = await this.repo.findOne({
      where: { id, is_active: true },
      relations: ['brand', 'category', 'variants']
    });
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    
    return product;
  }

  async findVariants(productId: number): Promise<ProductVariant[]> {
    // First verify product exists
    await this.findById(productId);
    
    return this.variantRepo.find({
      where: { product_id: productId, is_active: true },
      order: { variant_name: 'ASC', variant_value: 'ASC' }
    });
  }
}
