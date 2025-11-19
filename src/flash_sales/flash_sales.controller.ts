import { Controller, Get, Query, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { FlashSalesService } from './flash_sales.service';
import { CreateFlashSaleDto, UpdateFlashSaleDto, AddProductToFlashSaleDto, UpdateFlashSaleProductDto, BulkAddProductsDto } from './dto/flash-sale.dto';

// Lấy tất cả các sản phẩm đang flash sale
@Controller('flash-sales')
export class FlashSalesController {
  constructor(
    private readonly flashSalesService: FlashSalesService,
  ) {}

  // Lấy Flash Sale đang active
  @Get('active')
  async getActiveFlashSale() {
    const flashSale = await this.flashSalesService.findActiveFlashSale();

    if (!flashSale) {
      return {
        success: false,
        message: 'Hiện không có Flash Sale nào đang diễn ra',
        data: null,
      };
    }

    // Tính thời gian còn lại của flash sale
    const now = new Date();
    const endTime = new Date(flashSale.end_time);
    const timeRemaining = endTime.getTime() - now.getTime();

    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    // Map products với thông tin flash sale
    // Nếu có variant, lấy giá từ variant; nếu không, lấy từ product
    const products = flashSale.items.map((item) => {
      // Xác định original_price: ưu tiên variant, sau đó product, cuối cùng là item.original_price
      let originalPrice: number;
      if (item.variant_id && item.variant) {
        // Có variant: lấy giá từ variant (compare_price nếu có, không thì price)
        originalPrice = Number(item.variant.compare_price || item.variant.price || item.original_price);
      } else {
        // Không có variant: lấy từ product hoặc item.original_price
        originalPrice = Number(item.product.compare_price || item.product.price || item.original_price);
      }

      // Sale price luôn lấy từ flash_sale_items
      const salePrice = Number(item.sale_price);

      return {
        ...item.product,
        variant: item.variant ? {
          id: item.variant.id,
          variant_name: item.variant.variant_name,
          size: item.variant.size,
          flavor: item.variant.flavor,
          color: item.variant.color,
          price: item.variant.price,
          compare_price: item.variant.compare_price,
          sku: item.variant.sku,
        } : null,
        flash_sale: {
          item_id: item.id,
          variant_id: item.variant_id,
          original_price: originalPrice,
          sale_price: salePrice,
          discount_percent: this.flashSalesService.calculateDiscountPercent(
            originalPrice,
            salePrice,
          ),
          max_quantity: item.max_quantity,
          sold_quantity: item.sold_quantity,
          remaining: item.max_quantity ? item.max_quantity - item.sold_quantity : null,
        },
      };
    });

    return {
      success: true,
      data: {
        flashSale: {
          id: flashSale.id,
          name: flashSale.name,
          description: flashSale.description,
          start_time: flashSale.start_time,
          end_time: flashSale.end_time,
          time_remaining: {
            days,
            hours,
            minutes,
            seconds,
            total_seconds: Math.floor(timeRemaining / 1000),
          },
        },
        products,
      },
    };
  }

  // Lấy Flash Sale với filters
  @Get('active/filtered')
  async getActiveFlashSaleFiltered(
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('brandId') brandId?: string,
    @Query('sort') sort?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
  ) {
    const flashSale = await this.flashSalesService.findActiveFlashSale();

    if (!flashSale) {
      return {
        success: false,
        message: 'Hiện không có Flash Sale nào đang diễn ra',
        data: null,
      };
    }

    // Tính thời gian còn lại của flash sale
    const now = new Date();
    const endTime = new Date(flashSale.end_time);
    const timeRemaining = endTime.getTime() - now.getTime();

    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    // Map products với thông tin flash sale
    // Nếu có variant, lấy giá từ variant; nếu không, lấy từ product
    let products = flashSale.items.map((item) => {
      // Xác định original_price: ưu tiên variant, sau đó product, cuối cùng là item.original_price
      let originalPrice: number;
      if (item.variant_id && item.variant) {
        // Có variant: lấy giá từ variant (compare_price nếu có, không thì price)
        originalPrice = Number(item.variant.compare_price || item.variant.price || item.original_price);
      } else {
        // Không có variant: lấy từ product hoặc item.original_price
        originalPrice = Number(item.product.compare_price || item.product.price || item.original_price);
      }

      // Sale price luôn lấy từ flash_sale_items
      const salePrice = Number(item.sale_price);

      return {
        ...item.product,
        variant: item.variant ? {
          id: item.variant.id,
          variant_name: item.variant.variant_name,
          size: item.variant.size,
          flavor: item.variant.flavor,
          color: item.variant.color,
          price: item.variant.price,
          compare_price: item.variant.compare_price,
          sku: item.variant.sku,
        } : null,
        flash_sale: {
          item_id: item.id,
          variant_id: item.variant_id,
          original_price: originalPrice,
          sale_price: salePrice,
          discount_percent: this.flashSalesService.calculateDiscountPercent(
            originalPrice,
            salePrice,
          ),
          max_quantity: item.max_quantity,
          sold_quantity: item.sold_quantity,
          remaining: item.max_quantity ? item.max_quantity - item.sold_quantity : null,
        },
      };
    });

    // Filter by price
    if (minPrice) {
      const minPriceNum = Number(minPrice);
      products = products.filter((p) => p.flash_sale.sale_price >= minPriceNum);
    }
    if (maxPrice) {
      const maxPriceNum = Number(maxPrice);
      products = products.filter((p) => p.flash_sale.sale_price <= maxPriceNum);
    }

    // Filter by brand
    if (brandId) {
      const brandIdNum = Number(brandId);
      products = products.filter((p) => p.brand_id === brandIdNum);
    }

    // Sort
    switch (sort) {
      case 'price_asc':
        products.sort((a, b) => a.flash_sale.sale_price - b.flash_sale.sale_price);
        break;
      case 'price_desc':  
        products.sort((a, b) => b.flash_sale.sale_price - a.flash_sale.sale_price);
        break;  
      case 'name_asc':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        products.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
        products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    // Pagination
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 12;
    const startIdx = (pageNum - 1) * limitNum;
    const paginatedProducts = products.slice(startIdx, startIdx + limitNum);
    const totalPages = Math.ceil(products.length / limitNum);

    return {
      success: true,
      data: {
        flashSale: {
          id: flashSale.id,
          name: flashSale.name,
          description: flashSale.description,
          start_time: flashSale.start_time,
          end_time: flashSale.end_time,
          time_remaining: {
            days,
            hours,
            minutes,
            seconds,
            total_seconds: Math.floor(timeRemaining / 1000),
          },
        },
        products: paginatedProducts,
        pagination: {
          total: products.length,
          page: pageNum,
          limit: limitNum,
          totalPages,
        },
      },
    };
  }

  // ============== ADMIN FLASH SALE MANAGEMENT ==============

  // Admin: Lấy tất cả Flash Sales (có phân trang)
  @Get('admin/list')
  async getAllFlashSales(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string, // 'active', 'upcoming', 'expired', 'all'
  ) {
    return this.flashSalesService.getAllFlashSales(Number(page), Number(limit), status);
  }

  // Admin: Lấy chi tiết Flash Sale
  @Get('admin/:id')
  async getFlashSaleById(@Param('id', ParseIntPipe) id: number) {
    return this.flashSalesService.getFlashSaleById(id);
  }

  // Admin: Tạo Flash Sale mới
  @Post('admin')
  async createFlashSale(@Body() dto: CreateFlashSaleDto) {
    return this.flashSalesService.createFlashSale(dto);
  }

  // Admin: Cập nhật Flash Sale
  @Put('admin/:id')
  async updateFlashSale(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFlashSaleDto,
  ) {
    return this.flashSalesService.updateFlashSale(id, dto);
  }

  // Admin: Xóa Flash Sale
  @Delete('admin/:id')
  async deleteFlashSale(@Param('id', ParseIntPipe) id: number) {
    return this.flashSalesService.deleteFlashSale(id);
  }

  // Admin: Thêm sản phẩm vào Flash Sale
  @Post('admin/:id/products')
  async addProductToFlashSale(
    @Param('id', ParseIntPipe) flashSaleId: number,
    @Body() dto: AddProductToFlashSaleDto,
  ) {
    return this.flashSalesService.addProductToFlashSale(flashSaleId, dto);
  }

  // Admin: Thêm nhiều sản phẩm vào Flash Sale (bulk)
  @Post('admin/:id/products/bulk')
  async bulkAddProducts(
    @Param('id', ParseIntPipe) flashSaleId: number,
    @Body() dto: BulkAddProductsDto,
  ) {
    return this.flashSalesService.bulkAddProducts(flashSaleId, dto.products);
  }

  // Admin: Cập nhật sản phẩm trong Flash Sale
  @Put('admin/:id/products/:itemId')
  async updateFlashSaleProduct(
    @Param('id', ParseIntPipe) flashSaleId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateFlashSaleProductDto,
  ) {
    return this.flashSalesService.updateFlashSaleProduct(flashSaleId, itemId, dto);
  }

  // Admin: Xóa sản phẩm khỏi Flash Sale
  @Delete('admin/:id/products/:itemId')
  async removeProductFromFlashSale(
    @Param('id', ParseIntPipe) flashSaleId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.flashSalesService.removeProductFromFlashSale(flashSaleId, itemId);
  }

  // Admin: Lấy danh sách sản phẩm trong Flash Sale
  @Get('admin/:id/products')
  async getFlashSaleProducts(
    @Param('id', ParseIntPipe) flashSaleId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.flashSalesService.getFlashSaleProducts(flashSaleId, Number(page), Number(limit));
  }
}
        

    