import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductViewService } from '../product-views/product-view.service';
import { CreateProductDto } from './dto/createProductDto';
import { UpdateProductDto } from './dto/updateproductDto';
import { AdminProductFilterDto } from './dto/getProductDto';



@Controller('products')
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
        private readonly productViewService: ProductViewService
    ) {}

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

  
    // Lấy chi tiết sản phẩm theo ID và tự động lưu vào lịch sử xem
    @Get(':id')
    async findProductsId(
        @Param('id', ParseIntPipe) id: number,
        @Request() req
    ) {
        // Lấy thông tin sản phẩm
        const product = await this.productsService.findProductsId(id);
        
        // Tự động lưu vào lịch sử xem (chỉ nếu user đã đăng nhập)
        if (req.user?.id) {
            const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
            const userAgent = req.headers['user-agent'];
            
            // Chạy bất đồng bộ, không block response
            this.productViewService.addView(req.user.id, id, ipAddress, userAgent)
                .catch(() => {
                    // Silently fail - don't block response if view tracking fails
                });
        }
        
        return product;
    }

        

    
    // lấy sản phẩm trong khoảng giá cho category
    
  @Get(':categoryId/products')
  async getProductsByCategory(
    @Param('categoryId') categoryId: string,
    @Query('isFlashSale') isFlashSale?: boolean,
    
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('brandId') brandId?: string,
    @Query('sort') sort?: string, 
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
  ) {
    return this.productsService.getProductsByCategory({
      categoryId: Number(categoryId),
      isFlashSale: isFlashSale,
       priceMin: minPrice ? Number(minPrice) : undefined,
      priceMax: maxPrice ? Number(maxPrice) : undefined,
      brandId: brandId ? Number(brandId) : undefined,
      sort,
      page: Number(page),
      limit: Number(limit),
    });
  }

  // API Admin: Lấy danh sách sản phẩm phân trang
  @Get('admin/list')
  async getAdminProducts(@Query() query: AdminProductFilterDto) {
    return this.productsService.getAdminProducts(query);
  }

  // Migration: Fix featured_image cho các sản phẩm cũ
  @Post('admin/fix-images')
  async fixProductImages() {
    return this.productsService.fixProductImages();
  }

  @Get('admin/:id')
  async getAdminProductById(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getAdminProductById(id);
  }


  //------------------------admin-------------------
  // admin thêm sản phẩm mới 
  @Post('admin')
  async createProductAdmin(@Body() product: CreateProductDto) {
    return this.productsService.createProductAdmin(product);
  }
  

  // admin cập nhật sản phẩm 
  @Put(['admin/:id', 'admin/update/:id'])
  async updateProductAdmin(@Param('id', ParseIntPipe) id: number, @Body() product: UpdateProductDto) {
    return this.productsService.updateProductAdmin(id, product);
  }
  
  // admin xóa sản phẩm 
  @Delete(['admin/:id', 'admin/delete/:id'])
  async deleteProductAdmin(@Param('id', ParseIntPipe) id: number) {
    await this.productsService.deleteProductAdmin(id);
    return { success: true };
  }
  
  
}