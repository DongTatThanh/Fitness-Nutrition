import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingCarrier } from './shipping-carrier.entity';
import { ShippingZone } from './shipping-zone.entity';
import { ShippingRate } from './shipping-rate.entity';
import { Shipment } from './shipment.entity';
import { ShipmentTracking } from './shipment-tracking.entity';
import { Shipping } from './shipping.entity';
import { Order } from '../orders/order.entity';

// Services
import { ShippingCarriersService } from './shipping-carriers.service';
import { ShippingZonesService } from './shipping-zones.service';
import { ShippingRatesService } from './shipping-rates.service';
import { ShippingCalculatorService } from './shipping-calculator.service';
import { ShipmentsService } from './shipments.service';
import { ShippingsService } from './shippings.service';

// Controllers
import { ShippingCarriersController } from './shipping-carriers.controller';
import { ShippingZonesController } from './shipping-zones.controller';
import { ShippingRatesController } from './shipping-rates.controller';
import { ShippingController } from './shipments.controller';
import { ShippingsController } from './shippings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShippingCarrier,
      ShippingZone,
      ShippingRate,
      Shipment,
      ShipmentTracking,
      Shipping,
      Order,
    ]),
  ],
  controllers: [
    // Tạm thời comment các controller của hệ thống mới nếu bảng chưa được tạo
    // Uncomment sau khi chạy SQL script: database/RUN_THIS_FIRST_SHIPPING.sql
    ShippingCarriersController,
    ShippingZonesController,
    ShippingRatesController,
    ShippingController,
    ShippingsController, // Controller cho bảng shippings có sẵn
  ],
  providers: [
    ShippingCarriersService,
    ShippingZonesService,
    ShippingRatesService,
    ShippingCalculatorService,
    ShipmentsService,
    ShippingsService,
  ],
  exports: [
    ShippingCarriersService,
    ShippingZonesService,
    ShippingRatesService,
    ShippingCalculatorService,
    ShipmentsService,
    ShippingsService,
  ],
})
export class ShippingModule {}

