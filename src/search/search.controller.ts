import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * API tìm kiếm tổng hợp
   * GET /api/search?q=keyword&limit=10&types=products,categories,brands,stores
   *
   * Query Parameters:
   * - q (required): Từ khóa tìm kiếm
   * - limit (optional): Số lượng kết quả tối đa cho mỗi loại (mặc định: 10)
   * - types (optional): Các loại cần tìm kiếm, phân cách bằng dấu phẩy
   *   Ví dụ: products,categories hoặc products,brands,stores
   *   Mặc định: tìm kiếm tất cả (products, categories, brands, stores)
   *
   * Response:
   * {
   *   success: true,
   *   query: "từ khóa tìm kiếm",
   *   results: {
   *     products: { data: [...], total: số },
   *     categories: { data: [...], total: số },
   *     brands: { data: [...], total: số },
   *     stores: { data: [...], total: số },
   *     total: tổng số kết quả
   *   }
   * }
   */
  @Get()
  async search(
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @Query('types') types?: string,
  ) {
    // Validate query parameter
    if (!query || query.trim().length === 0) {
      throw new BadRequestException({
        success: false,
        message: 'Vui lòng nhập từ khóa tìm kiếm (query parameter "q" là bắt buộc)',
      });
    }

    // Parse limit (mặc định 10)
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    if (isNaN(limitNumber) || limitNumber < 1) {
      throw new BadRequestException({
        success: false,
        message: 'Limit phải là số nguyên dương',
      });
    }

    // Parse types (mặc định tất cả)
    let searchTypes: ('products' | 'categories' | 'brands' | 'stores')[] | undefined;
    if (types) {
      const validTypes = ['products', 'categories', 'brands', 'stores'];
      const requestedTypes = types.split(',').map((t) => t.trim().toLowerCase());

      // Validate types
      const invalidTypes = requestedTypes.filter((t) => !validTypes.includes(t));
      if (invalidTypes.length > 0) {
        throw new BadRequestException({
          success: false,
          message: `Loại tìm kiếm không hợp lệ: ${invalidTypes.join(', ')}. Các loại hợp lệ: ${validTypes.join(', ')}`,
        });
      }

      searchTypes = requestedTypes as ('products' | 'categories' | 'brands' | 'stores')[];
    }

    // Thực hiện tìm kiếm
    const results = await this.searchService.searchAll(query, limitNumber, searchTypes);

    return {
      success: true,
      query: query.trim(),
      limit: limitNumber,
      types: searchTypes || ['products', 'categories', 'brands', 'stores'],
      results,
    };
  }
}

