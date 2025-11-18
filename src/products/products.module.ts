import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './product.entity';
import { ProductViewModule } from '../product-views/product-view.module';
import { ProductImage } from './product-image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductImage]), ProductViewModule],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}