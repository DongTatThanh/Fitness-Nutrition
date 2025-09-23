import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem, Product, ProductVariant])],
  providers: [CartService],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}