import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './product.entity';
import { ProductViewModule } from '../product-views/product-view.module';
import { ProductImage } from './product-image.entity';
import { ProductVariant } from './product-variant.entity';
import { FlashSalesModule } from '../flash_sales/flash-_ales.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage, ProductVariant]), 
    ProductViewModule,
    FlashSalesModule, // Import FlashSalesModule để sử dụng FlashSalesService
  ],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}