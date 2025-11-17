import { Module } from '@nestjs/common';
import { OrdersGateway } from './gteway';

@Module({
  providers: [OrdersGateway],
  exports: [OrdersGateway],
})
export class WebSocketModule {}

