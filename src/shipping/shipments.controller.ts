import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ShipmentsService } from './shipments.service';
import { ShippingCalculatorService } from './shipping-calculator.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import { CalculateShippingFeeDto } from './dto/calculate-shipping-fee.dto';
import { ShipmentStatus } from './shipment.entity';

@Controller('shipping')
export class ShippingController {
  constructor(
    private readonly shipmentsService: ShipmentsService,
    private readonly calculatorService: ShippingCalculatorService,
  ) {}

  /**
   * Tính phí vận chuyển (Public - không cần auth)
   * POST /shipping/calculate
   */
  @Post('calculate')
  async calculateShippingFee(@Body() dto: CalculateShippingFeeDto) {
    return this.calculatorService.calculateShippingFee(dto);
  }

  /**
   * Tra cứu đơn hàng (Public - không cần auth)
   * GET /shipping/track/:trackingNumber
   */
  @Get('track/:trackingNumber')
  async trackShipment(
    @Param('trackingNumber') trackingNumber: string,
  ) {
    return this.shipmentsService.findByTrackingNumber(trackingNumber);
  }

  // ============== ADMIN ROUTES ==============

  /**
   * Lấy danh sách đơn vận chuyển
   * GET /shipping/shipments?page=1&limit=20&status=pending&carrierId=1&orderId=1
   */
  @Get('shipments')
  @UseGuards(AuthGuard('admin-jwt'))
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ShipmentStatus,
    @Query('carrierId') carrierId?: string,
    @Query('orderId') orderId?: string,
  ) {
    return this.shipmentsService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      status,
      carrierId ? Number(carrierId) : undefined,
      orderId ? Number(orderId) : undefined,
    );
  }

  /**
   * Lấy chi tiết đơn vận chuyển
   * GET /shipping/shipments/:id
   */
  @Get('shipments/:id')
  @UseGuards(AuthGuard('admin-jwt'))
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shipmentsService.findOne(id);
  }

  /**
   * Lấy lịch sử tracking
   * GET /shipping/shipments/:id/tracking
   */
  @Get('shipments/:id/tracking')
  @UseGuards(AuthGuard('admin-jwt'))
  async getTrackingHistory(@Param('id', ParseIntPipe) id: number) {
    return this.shipmentsService.getTrackingHistory(id);
  }

  /**
   * Tạo đơn vận chuyển từ order
   * POST /shipping/shipments
   */
  @Post('shipments')
  @UseGuards(AuthGuard('admin-jwt'))
  async create(@Body() dto: CreateShipmentDto, @Req() req: any) {
    const createdBy = req.user?.adminId || req.user?.id || req.user?.sub;
    return this.shipmentsService.create(dto, createdBy);
  }

  /**
   * Cập nhật trạng thái đơn vận chuyển
   * PUT /shipping/shipments/:id/status
   */
  @Put('shipments/:id/status')
  @UseGuards(AuthGuard('admin-jwt'))
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShipmentStatusDto,
    @Req() req: any,
  ) {
    const updatedBy = req.user?.adminId || req.user?.id || req.user?.sub;
    return this.shipmentsService.updateStatus(id, dto, updatedBy);
  }

  /**
   * Lấy shipment theo order_id
   * GET /shipping/shipments/order/:orderId
   */
  @Get('shipments/order/:orderId')
  @UseGuards(AuthGuard('admin-jwt'))
  async findByOrderId(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.shipmentsService.findByOrderId(orderId);
  }
}

