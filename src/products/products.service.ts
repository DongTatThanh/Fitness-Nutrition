import { Product } from 'src/products/product.entity';

import { Injectable, NotFoundException } from '@nestjs/common';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { promises } from 'dns';
import { Category } from 'src/categories/category.entity';
import e from 'express';



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
  //  lấy sản phẩm trong khoảng giá
 async getProductsByCategory(filter: {
  categoryId: number;
  priceMin?: number;
  priceMax?: number;
  sort?: string;
  page: number;
  limit: number;
}) {
  const query = this.productsRepository.createQueryBuilder('product');

  // Lọc theo danh mục
  query.where('product.category_id = :categoryId', { categoryId: filter.categoryId });

  // Lọc theo khoảng giá
  if (filter.priceMin !== undefined) {
    query.andWhere('product.price >= :minPrice', { minPrice: filter.priceMin });
  }
  if (filter.priceMax !== undefined) {
    query.andWhere('product.price <= :maxPrice', { maxPrice: filter.priceMax });
  }

  // Sắp xếp
  switch (filter.sort) {
    case 'price_asc':
      query.orderBy('product.price', 'ASC');
      break;
    case 'price_desc':
      query.orderBy('product.price', 'DESC');
      break;
    default:
      query.orderBy('product.created_at', 'DESC');
      break;
  }

  // Phân trang
  query.skip((filter.page - 1) * filter.limit).take(filter.limit);

  const [data, total] = await query.getManyAndCount();

  return {
    data,
    total,
    currentPage: filter.page,
    totalPages: Math.ceil(total / filter.limit),
  };
}

// sắp xếp sản phẩm theo giá và bảng chữ cái 

async sortProducts(sort?: string): Promise<Product[]> {
  let order : any = {};
  switch (sort) {
    case 'name_asc':
      order = { name: 'ASC' };
      break;
    case 'name_desc':
      order = { name: 'DESC' };
      break;

  case 'price_asc': 
      order = { price: 'ASC' };
      break;  
  case 'price_desc':
      order = { price: 'DESC' };
      break;
    default:
      order = { created_at: 'DESC' };
  }

  return this.productsRepository.find({
    order,
  });
}
}