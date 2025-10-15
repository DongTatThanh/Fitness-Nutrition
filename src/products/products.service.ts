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


    async findAll(): Promise<Product[]> {
      return await this.productsRepository.find({
        order: {
          created_at: 'DESC'   /// sắp xêp theo thứ tự tăng dần cũ mới ....
        }   
      });
    }

   async findOnSaleProducts(limit: number = 10): Promise<Product[]> {
  return this.productsRepository
    .createQueryBuilder('product')
    .leftJoinAndSelect('product.brand', 'brand')
    .leftJoinAndSelect('product.category', 'category')
    .where('product.compare_price > product.price')
    .andWhere('product.compare_price IS NOT NULL')
    .addOrderBy('(product.compare_price - product.price) / product.price', 'DESC')
    .limit(limit)
    .getMany();
}

}