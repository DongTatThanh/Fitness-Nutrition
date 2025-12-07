
import { CartModule } from './../cart/cart.module';
import { DiscountCodeModule } from './../discount_code/discount_code.module';
import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderItem } from './orderItem.entity';
import { WebSocketModule } from '../WebSocket/websocket.module';
import { ProductsModule } from '../products/products.module';
import { ScheduleModule } from '@nestjs/schedule';


@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    CartModule,
    DiscountCodeModule,
    WebSocketModule,
    ProductsModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
