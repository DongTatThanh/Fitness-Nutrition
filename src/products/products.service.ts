
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { promises } from 'dns';


@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}
 /// lấy tất cả các danh sách sản phẩm

    async findAll(): Promise<Product[]> {
      return await this.productsRepository.find({
        order: {
          created_at: 'DESC'   /// sắp xêp theo thứ tự tăng dần cũ mới ....
        }   
      });
    }
    // lấy tất cả các sản phẩm đang được giảm giá

   async findOnSaleProducts(limit: number = 10): Promise<Product[]> {
  return await this.productsRepository
    .createQueryBuilder('product')
    .leftJoinAndSelect('product.brand', 'brand')
    .leftJoinAndSelect('product.category', 'category')
    .where('product.compare_price > product.price')
    .andWhere('product.compare_price IS NOT NULL')
    .addOrderBy('(product.compare_price - product.price) / product.price', 'DESC')
    .limit(limit)
    .getMany();
}
// lấy các sản phẩm bán chạy nhất 
async findBestSellers(limit: number = 10): Promise<Product[]> {
  const result = await this.productsRepository
    .createQueryBuilder('product')
    .leftJoinAndSelect('product.brand', 'brand')
    .leftJoinAndSelect('product.category', 'category')
    .leftJoin('order_items', 'oi', 'oi.product_id = product.id')
    .leftJoin('orders', 'o', 'o.id = oi.order_id')
    .select([
      'product.id',
      'product.name',
      'product.slug',
      'product.sku',
      'product.price',
      'product.compare_price',
      'product.featured_image',
      'product.short_description',
      'brand.id',
      'brand.name',
      'category.id',
      'category.name'
    ])
    .addSelect('COALESCE(SUM(oi.quantity), 0)', 'total_sold')
    .where('o.status IN (:...statuses)', { 
      statuses: ['completed', 'delivered', 'processing'] 
    })
    .groupBy('product.id')
    .addGroupBy('brand.id')
    .addGroupBy('category.id')
    .orderBy('total_sold', 'DESC')
    .addOrderBy('product.created_at', 'DESC')
    .limit(limit)
    .getRawAndEntities();
  
  return result.entities;
}


   

}
  