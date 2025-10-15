import { Controller, Get } from '@nestjs/common';    
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    // lấy tất cả các sản phẩm 
    @Get() 
    async findAll() {
        return this.productsService.findAll();
    }

    // lấy các sản phẩm đang giảm giá 
    @Get("onSale")
     async findOnSaleProducts(){
        return this.productsService.findOnSaleProducts();
     }


}