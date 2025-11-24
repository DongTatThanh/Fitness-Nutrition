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
import { ShippingsService } from './shippings.service';
import { CreateShippingDto } from './dto/create-shipping.dto';
import { UpdateShippingDto } from './dto/update-shipping.dto';
import { ShippingStatus } from './shipping.entity';

@Controller('shippings')
export class ShippingsController {
  constructor(private readonly shippingsService: ShippingsService) {}

  /**
   * Tra cứu đơn hàng (Public - không cần auth)
   * GET /shippings/track/:trackingNumber
   */
  @Get('track/:trackingNumber')
  async trackShipping(@Param('trackingNumber') trackingNumber: string) {
    return this.shippingsService.findByTrackingNumber(trackingNumber);
  }

  // ============== ADMIN ROUTES ==============

  /**
   * Lấy danh sách đơn vận chuyển
   * GET /shippings?page=1&limit=20&status=pending&orderId=1&carrier=GHTK
   */
  @Get()
  @UseGuards(AuthGuard('admin-jwt'))
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ShippingStatus,
    @Query('orderId') orderId?: string,
    @Query('carrier') carrier?: string,
  ) {
    return this.shippingsService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      status,
      orderId ? Number(orderId) : undefined,
      carrier,
    );
  }

  /**
   * Lấy chi tiết đơn vận chuyển
   * GET /shippings/:id
   */
  @Get(':id')
  @UseGuards(AuthGuard('admin-jwt'))
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shippingsService.findOne(id);
  }

  /**
   * Lấy shipping theo order_id
   * GET /shippings/order/:orderId
   */
  @Get('order/:orderId')
  @UseGuards(AuthGuard('admin-jwt'))
  async findByOrderId(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.shippingsService.findByOrderId(orderId);
  }

  /**
   * Tạo đơn vận chuyển từ order
   * POST /shippings
   */
  @Post()
  @UseGuards(AuthGuard('admin-jwt'))
  async create(@Body() dto: CreateShippingDto) {
    return this.shippingsService.create(dto);
  }

  /**
   * Cập nhật đơn vận chuyển
   * PUT /shippings/:id
   */
  @Put(':id')
  @UseGuards(AuthGuard('admin-jwt'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShippingDto,
  ) {
    return this.shippingsService.update(id, dto);
  }

  /**
   * Cập nhật trạng thái đơn vận chuyển
   * PUT /shippings/:id/status
   */
  @Put(':id/status')
  @UseGuards(AuthGuard('admin-jwt'))
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ShippingStatus,
    @Body('location') location?: string,
    @Body('description') description?: string,
  ) {
    return this.shippingsService.updateStatus(id, status, location, description);
  }

  /**
   * Xóa đơn vận chuyển
   * DELETE /shippings/:id
   */
  @Delete(':id')
  @UseGuards(AuthGuard('admin-jwt'))
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.shippingsService.remove(id);
  }
}

