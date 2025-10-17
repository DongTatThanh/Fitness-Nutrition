import { In } from "typeorm";
import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { FlashSale } from "./flash-sale.entity";
import { FlashSaleProduct } from "./flash-sale-product.entity";
import { ProductsService } from "../products/products.service";



@Injectable()
export class FlashSalesService {
    constructor(
        @InjectRepository(FlashSale)
        private flashSalesRepo: Repository<FlashSale>,
        @InjectRepository(FlashSaleProduct)
        private flashSaleProductsRepo: Repository<FlashSaleProduct>,
        private productsService: ProductsService,
    ) {}
}