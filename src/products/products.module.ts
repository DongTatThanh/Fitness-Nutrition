import { Controller } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductViewModule } from '../product-views/product-view.module';
import { ProductsController } from "./products.controller";
import { Product } from "./product.entity";
@Module({
    imports: [
        TypeOrmModule.forFeature([Product]),
        ProductViewModule
    ],
    providers: [ProductsService],   
    controllers: [ProductsController],
    exports: [ProductsService]
})
export class ProductsModule {}