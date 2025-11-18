import { Controller, Get, Query, Param, ParseIntPipe, Request, Post, Body, Put, Delete } from '@nestjs/common';    
import { ProductsService } from './products.service';
import { ProductViewService } from '../product-views/product-view.service';
import { CreateVariantDto, UpdateVariantDto } from './dto/variant.dto';
import { CreateProductDto } from './dto/createProductDto';
import { UpdateProductDto } from './dto/updateproductDto';
import { get } from 'http';



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
                .catch(err => console.error('Error saving product view:', err));
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
  async getAdminProducts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    let query = this.productsService['productsRepository']
      .createQueryBuilder('product')
      .skip(skip)
      .take(Number(limit));

    if (search) {
      query = query.where('product.name LIKE :search OR product.description LIKE :search', {
        search: `%${search}%`
      });
    }

    if (status) {
      query = query.andWhere('product.status = :status', { status });
    }

    const [products, total] = await query.getManyAndCount();

    return {
      data: products,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit))
    };
  }

  // ============== VARIANT MANAGEMENT ==============
  
  // Lấy danh sách variants của sản phẩm
  @Get(':id/variants')
  async getProductVariants(@Param('id', ParseIntPipe) productId: number) {
    return this.productsService.getProductVariants(productId);
  }

  // Thêm variant mới cho sản phẩm
  @Post(':id/variants')
  async addProductVariant(
    @Param('id', ParseIntPipe) productId: number,
    @Body() variantDto: CreateVariantDto
  ) {
    return this.productsService.addProductVariant(productId, variantDto);
  }

  // Cập nhật variant
  @Put('variants/:variantId')
  async updateVariant(
    @Param('variantId', ParseIntPipe) variantId: number,
    @Body() variantDto: UpdateVariantDto
  ) {
    return this.productsService.updateVariant(variantId, variantDto);
  }

  // Xóa variant
  @Delete('variants/:variantId')
  async deleteVariant(@Param('variantId', ParseIntPipe) variantId: number) {
    return this.productsService.deleteVariant(variantId);
  }

  // ============== ADMIN PRODUCT MANAGEMENT ==============
  
  // Admin: Lấy chi tiết sản phẩm
  @Get('admin/:id')
  async getAdminProductById(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getAdminProductById(id);
  }

  // Admin: Tạo sản phẩm mới
  @Post('admin')
  async createProductAdmin(@Body() productDto: CreateProductDto) {
    return this.productsService.createProductAdmin(productDto);
  }

  // Admin: Cập nhật sản phẩm
  @Put('admin/:id')
  async updateProductAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() productDto: UpdateProductDto
  ) {
    return this.productsService.updateProductAdmin(id, productDto);
  }

  // Admin: Xóa sản phẩm
  @Delete('admin/:id')
  async deleteProductAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.deleteProductAdmin(id);
  }

  // Admin: Fix ảnh sản phẩm
  @Post('admin/fix-images')
  async fixProductImages() {
    return this.productsService.fixProductImages();
  }
}
