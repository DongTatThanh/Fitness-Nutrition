import { Module } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { PaymentController } from "./payment.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import {payment} from "./payment.entity";

@Module({
    imports: [TypeOrmModule.forFeature([payment])],
    controllers: [PaymentController],
    providers: [PaymentService],
  exports: [PaymentService]
})
export class PaymentModule {}   