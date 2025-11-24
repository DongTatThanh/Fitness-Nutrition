import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ShippingRatesService } from './shipping-rates.service';
import { CreateShippingRateDto } from './dto/create-shipping-rate.dto';

@Controller('shipping/rates')
@UseGuards(AuthGuard('admin-jwt'))
export class ShippingRatesController {
  constructor(private readonly ratesService: ShippingRatesService) {}

  /**
   * Lấy danh sách bảng giá vận chuyển
   * GET /shipping/rates?page=1&limit=20&carrierId=1&zoneId=1
   */
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('carrierId') carrierId?: string,
    @Query('zoneId') zoneId?: string,
  ) {
    return this.ratesService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      carrierId ? Number(carrierId) : undefined,
      zoneId ? Number(zoneId) : undefined,
    );
  }

  /**
   * Lấy chi tiết bảng giá
   * GET /shipping/rates/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ratesService.findOne(id);
  }

  /**
   * Tạo bảng giá mới
   * POST /shipping/rates
   */
  @Post()
  async create(@Body() dto: CreateShippingRateDto) {
    return this.ratesService.create(dto);
  }

  /**
   * Cập nhật bảng giá
   * PUT /shipping/rates/:id
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateShippingRateDto>,
  ) {
    return this.ratesService.update(id, dto);
  }

  /**
   * Xóa bảng giá
   * DELETE /shipping/rates/:id
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.ratesService.remove(id);
  }
}

