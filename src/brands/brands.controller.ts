import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from "@nestjs/common";
import { BrandsService } from "./brands.service";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";
import { UpdateBrandStatusDto } from "./dto/update-brand-status.dto";
import { BrandAdminQueryDto } from "./dto/brand-query.dto";

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  // ===================== Admin APIs =====================
  @Post('admin')
  async createBrand(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.createBrand(createBrandDto);
  }

  @Put('admin/:id')
  async updateBrand(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBrandDto: UpdateBrandDto,
  ) {
    return this.brandsService.updateBrand(id, updateBrandDto);
  }

  @Delete('admin/:id')
  async deleteBrand(@Param('id', ParseIntPipe) id: number) {
    await this.brandsService.deleteBrand(id);
    return {
      success: true,
      message: 'Đã xóa thương hiệu thành công',
    };
  }

  @Get('admin')
  async getAdminBrands(@Query() query: BrandAdminQueryDto) {
    const options = {
      search: query.search,
      page: query.page,
      limit: query.limit,
      is_active: query.is_active !== undefined ? query.is_active === 'true' : undefined,
      is_featured: query.is_featured !== undefined ? query.is_featured === 'true' : undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    return this.brandsService.getAdminBrands(options);
  }

  @Get('admin/:id')
  async getBrandDetails(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.getBrandDetailsWithStats(id);
  }

  @Patch('admin/:id/status')
  async updateBrandStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBrandStatusDto: UpdateBrandStatusDto,
  ) {
    return this.brandsService.updateBrandStatus(id, updateBrandStatusDto.is_active);
  }

  @Patch('admin/:id/logo')
  async updateBrandLogo(
    @Param('id', ParseIntPipe) id: number,
    @Body('logo_url') logoUrl: string,
  ) {
    return this.brandsService.updateBrandImage(id, logoUrl);
  }

  // ===================== Public APIs =====================
  @Get()
  async findAll() {
    return this.brandsService.findBrandAll();
  }

  @Get('featured')
  async findFeaturedBrands() {
    return this.brandsService.findFeaturedBrands();
  }

  @Get('all/brands')
  async findAllBrands() {
    return this.brandsService.findAllBrands();
  }

  @Get(':id/products')
  async findBrandWithProducts(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const options = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 12,
      status: status || 'active',
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      sortBy: sortBy || 'created_at',
      sortOrder: sortOrder || 'DESC',
    };

    return this.brandsService.findBrandWithProducts(id, options);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.findBrandById(id);
  }
}