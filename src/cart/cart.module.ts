
import { Module } from '@nestjs/common';

import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CartItem } from './cart_Item.entity';
import { Cart } from './cart.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/products/product.entity';
import { Order } from 'src/orders/order.entity';
import { AuthModule } from '../auth/auth.module';
import { FlashSalesModule } from '../flash_sales/flash-_ales.module';

@Module({
      imports: [
        TypeOrmModule.forFeature([Cart, CartItem ,Product ]), 
        AuthModule,
        FlashSalesModule,
      ],
    controllers: [CartController],
    providers: [CartService, ],
    exports: [CartService ],


})
export class CartModule {}