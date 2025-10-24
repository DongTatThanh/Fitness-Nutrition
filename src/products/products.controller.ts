import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';    
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
    @Get("on-sale")
    async findOnSaleProducts(@Query('limit') limit?: number) {
        return this.productsService.findOnSaleProducts(limit ? +limit : 10);
    }

    // lấy các sản phẩm bán chạy nhất
    @Get("best-sellers")
    async findBestSellers(@Query('limit') limit?: number) {
        return this.productsService.findBestSellers(limit ? +limit : 10);
    }

    // Lấy chi tiết sản phẩm theo ID
    @Get(':id')
    async findProductsId(@Param('id', ParseIntPipe) id: number) {
        return this.productsService.findProductsId(id);
    }

    // lấy sản phẩm trong khoảng giá
    
    @Get(':categoryId/products')
    async GetProductsByCategory(
        @Param ('categoryId') categoryId: number,
        @Query ('minPrice') PriceMin: number,
        @Query ('maxPrice') PriceMax: number,
        @Query('sort') sort?: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 12
    ) {
        return this.productsService.GetProductsByCategory({
            categoryId,
            priceMin: PriceMin,
            priceMax: PriceMax,
            sort,
            page,
            limit,
        });
    }
}