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
import { ShippingCarriersService } from './shipping-carriers.service';
import { CreateShippingCarrierDto } from './dto/create-shipping-carrier.dto';
import { UpdateShippingCarrierDto } from './dto/update-shipping-carrier.dto';

@Controller('shipping/carriers')
@UseGuards(AuthGuard('admin-jwt'))
export class ShippingCarriersController {
  constructor(private readonly carriersService: ShippingCarriersService) {}

  /**
   * Lấy danh sách đơn vị vận chuyển
   * GET /shipping/carriers?page=1&limit=20&isActive=true
   */
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.carriersService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    );
  }

  /**
   * Lấy danh sách đơn vị vận chuyển đang hoạt động
   * GET /shipping/carriers/active
   */
  @Get('active')
  async findActive() {
    return this.carriersService.findActive();
  }

  /**
   * Lấy chi tiết đơn vị vận chuyển
   * GET /shipping/carriers/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.carriersService.findOne(id);
  }

  /**
   * Tạo đơn vị vận chuyển mới
   * POST /shipping/carriers
   */
  @Post()
  async create(@Body() dto: CreateShippingCarrierDto) {
    return this.carriersService.create(dto);
  }

  /**
   * Cập nhật đơn vị vận chuyển
   * PUT /shipping/carriers/:id
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShippingCarrierDto,
  ) {
    return this.carriersService.update(id, dto);
  }

  /**
   * Xóa đơn vị vận chuyển
   * DELETE /shipping/carriers/:id
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.carriersService.remove(id);
  }
}

