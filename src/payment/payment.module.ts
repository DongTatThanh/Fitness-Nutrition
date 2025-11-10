import { Module } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { PaymentController } from "./payment.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Payment } from "./payment.entity";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { OrderModule } from "../orders/order.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Payment]),
        HttpModule,
        ConfigModule,
        OrderModule
    ],
    controllers: [PaymentController],
    providers: [PaymentService],
    exports: [PaymentService]
})
export class PaymentModule {}   