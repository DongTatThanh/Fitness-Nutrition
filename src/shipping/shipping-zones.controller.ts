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
import { ShippingZonesService } from './shipping-zones.service';
import { CreateShippingZoneDto } from './dto/create-shipping-zone.dto';

@Controller('shipping/zones')
@UseGuards(AuthGuard('admin-jwt'))
export class ShippingZonesController {
  constructor(private readonly zonesService: ShippingZonesService) {}

  /**
   * Lấy danh sách khu vực vận chuyển
   * GET /shipping/zones?page=1&limit=20&isActive=true
   */
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.zonesService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    );
  }

  /**
   * Lấy danh sách khu vực đang hoạt động
   * GET /shipping/zones/active
   */
  @Get('active')
  async findActive() {
    return this.zonesService.findActive();
  }

  /**
   * Lấy chi tiết khu vực
   * GET /shipping/zones/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.zonesService.findOne(id);
  }

  /**
   * Tạo khu vực mới
   * POST /shipping/zones
   */
  @Post()
  async create(@Body() dto: CreateShippingZoneDto) {
    return this.zonesService.create(dto);
  }

  /**
   * Cập nhật khu vực
   * PUT /shipping/zones/:id
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateShippingZoneDto>,
  ) {
    return this.zonesService.update(id, dto);
  }

  /**
   * Xóa khu vực
   * DELETE /shipping/zones/:id
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.zonesService.remove(id);
  }
}

