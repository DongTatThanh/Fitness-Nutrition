import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashSalesController } from './flash_sales.controller';
import { FlashSalesService } from './flash_sales.service';
import { FlashSale } from './flash-sale.entity';
import { FlashSaleProduct } from './flash-sale-product.entity';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FlashSale, FlashSaleProduct, Product, ProductVariant]),
  ],
  controllers: [FlashSalesController],
  providers: [FlashSalesService],
  exports: [FlashSalesService],
})
export class FlashSalesModule {}