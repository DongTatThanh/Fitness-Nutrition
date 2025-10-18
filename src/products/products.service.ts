
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Between, Repository } from 'typeorm';
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

  // Cập nhật ảnh product
  async updateProductImage(productId: number, imageUrl: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException(`Product với ID ${productId} không tồn tại`);
    }

    product.featured_image = imageUrl;
    return this.productsRepository.save(product);
  }

  // lấy chi tiết sản phẩm theo id
  async findProductsId(productId: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: {
        id: productId,
        status: 'active'
      },
      relations: ['brand', 
        'category',
         'variants',
          'reviews',
          'attributes']
    });

    if (!product) {
      throw new NotFoundException(`Product với ID ${productId} không tồn tại`);
    }

    return product;
  }
  //  lấy các sản phẩm cùng phân khúc 
  async findSimilarPriceProducts  // range + - 20%
  (productId: number, range: number = 20, limit: number = 8): Promise<Product[]>
   {
    const  product = await this.productsRepository.findOne({
      where: { id: productId }
    });
    if (!product) {
      throw new NotFoundException(`sản phẩm cùng giá tiền ${productId} không tồn tại`);
    }
    // tính khoảng giá sản phẩm
    const basePrice = product.price;
    const minPrice = basePrice * (1 - range / 100);
    const maxPrice = basePrice * (1 + range / 100);

    // tìm sp trong khoảng giá đó
    const products = await this.productsRepository.find({
      where: {
         id : productId,
          status: 'active',
          price:  Between (minPrice, maxPrice)  //  dùng dể so sánh giá trị 
   
      },
      order : {
        category_id: product.category_id ? 'ASC' : 'DESC',
        price: 'ASC'  // sắp xếp gia theo giá trị tăng dần 
      },

      take: limit
    });
    return products;
  }

}
