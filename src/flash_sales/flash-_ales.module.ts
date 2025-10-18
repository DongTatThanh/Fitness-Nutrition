import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashSalesController } from './flash_sales.controller';
import { FlashSalesService } from './flash_sales.service';
import { FlashSale } from './flash-sale.entity';
import { FlashSaleProduct } from './flash-sale-product.entity';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FlashSale, FlashSaleProduct]),
    ProductsModule,
  ],
  controllers: [FlashSalesController],
  providers: [FlashSalesService],
  exports: [FlashSalesService],
})
export class FlashSalesModule {}