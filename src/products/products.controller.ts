import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';    
import { ProductsService } from './products.service';


@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) 
    {}

    // lấy tất cả các sản phẩm 
    @Get() 
    async findAll() {
        return this.productsService.findAll();
    }

    // lấy các sản phẩm đang giảm giá 
    @Get("on-sale")
    async findOnSaleProducts(@Query('limit') limit?: number)
    {
        return this.productsService.findOnSaleProducts(limit ? +limit : 10);
    }

    // lấy các sản phẩm bán chạy nhất
    @Get("best-sellers")
    async findBestSellers(@Query('limit') limit?: number
) {
        return this.productsService.findBestSellers(limit ? +limit : 10);
    }

    // Lấy chi tiết sản phẩm theo ID
    @Get(':id')
    async findProductsId(@Param('id', ParseIntPipe) id: number) 
    {
        return this.productsService.findProductsId(id);
    }
    
    // lấy sản phẩm trong khoảng giá
    
  @Get(':categoryId/products')
async getProductsByCategory(
  @Param('categoryId') categoryId: number,
  @Query('minPrice') minPrice?: string,
  @Query('maxPrice') maxPrice?: string,
  @Query('sort') sort?: string,
  @Query('page') page: string = '1',
  @Query('limit') limit: string = '12',
) {
  return this.productsService.getProductsByCategory({
    categoryId: Number(categoryId),
    priceMin: minPrice ? Number(minPrice) : undefined,
    priceMax: maxPrice ? Number(maxPrice) : undefined,
    sort,
    page: Number(page),
    limit: Number(limit),
  });
}
}   