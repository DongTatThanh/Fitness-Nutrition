
import { Module } from '@nestjs/common';


import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CartItem } from './cart_Item.entity';
import { Cart } from './cart.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
      imports: [TypeOrmModule.forFeature([Cart, CartItem])],
    controllers: [CartController],
    providers: [CartService],
    exports: [CartService],

})
export class CartModule {}