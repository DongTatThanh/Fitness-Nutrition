import { Controller } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ProductsController } from "./products.controller";
import { Product } from "./product.entity";
@Module({
    imports: [TypeOrmModule.forFeature([Product])],
    providers: [ProductsService],   
    controllers: [ProductsController],
    exports: [ProductsService]
})
export class ProductsModule {}