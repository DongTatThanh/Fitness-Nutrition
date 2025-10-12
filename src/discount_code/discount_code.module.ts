import { Module } from "@nestjs/common";
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscountCode } from "../entities/discount_code.entity";
import { DiscountCodeService } from "./discount_code.service";
import { DiscountCodeController } from "./discount_code.controller";

@Module({
    imports: [TypeOrmModule.forFeature([DiscountCode])],
    providers: [DiscountCodeService],
    controllers: [DiscountCodeController],
    exports: [DiscountCodeService]
})
export class DiscountCodeModule {}    
