import { Controller, Get, Query } from '@nestjs/common';
import { FlashSalesService } from './flash_sales.service';

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
    const products = flashSale.items.map((item) => ({
      ...item.product,
      flash_sale: {
        item_id: item.id,
        original_price: item.original_price,
        sale_price: item.sale_price,
        discount_percent: this.flashSalesService.calculateDiscountPercent(
          Number(item.original_price),
          Number(item.sale_price),
        ),
        max_quantity: item.max_quantity,
        sold_quantity: item.sold_quantity,
        remaining: item.max_quantity ? item.max_quantity - item.sold_quantity : null,
      },
    }));

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
    let products = flashSale.items.map((item) => ({
      ...item.product,
      flash_sale: {
        item_id: item.id,
        original_price: item.original_price,
        sale_price: item.sale_price,
        discount_percent: this.flashSalesService.calculateDiscountPercent(
          Number(item.original_price),
          Number(item.sale_price),
        ),
        max_quantity: item.max_quantity,
        sold_quantity: item.sold_quantity,
        remaining: item.max_quantity ? item.max_quantity - item.sold_quantity : null,
      },
    }));

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
}
        

    