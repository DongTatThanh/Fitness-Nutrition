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
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { AddItemDto } from './dto/add-item.dto';
import { ReceiveItemDto } from './dto/receive-item.dto';
import { PurchaseOrderStatus } from './purchase-order.entity';

@Controller('purchase-orders')
@UseGuards(AuthGuard('admin-jwt'))
export class PurchaseOrdersController {
  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersService,
  ) {}

  /**
   * Lấy danh sách đơn nhập hàng
   * GET /purchase-orders?page=1&limit=20&status=approved&supplierId=1
   */
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: PurchaseOrderStatus,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.purchaseOrdersService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      status,
      supplierId ? Number(supplierId) : undefined,
    );
  }

  /**
   * Lấy chi tiết đơn nhập hàng
   * GET /purchase-orders/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrdersService.findOne(id);
  }

  /**
   * Tạo đơn nhập hàng mới
   * POST /purchase-orders
   */
  @Post()
  async create(
    @Body() dto: CreatePurchaseOrderDto,
    @Req() req: any,
  ) {
    const createdBy = req.user?.adminId || req.user?.id || req.user?.sub;
    return this.purchaseOrdersService.create(dto, createdBy);
  }

  /**
   * Cập nhật đơn nhập hàng
   * PUT /purchase-orders/:id
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.update(id, dto);
  }

  /**
   * Duyệt đơn nhập hàng
   * POST /purchase-orders/:id/approve
   */
  @Post(':id/approve')
  async approve(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrdersService.approve(id);
  }

  /**
   * Nhận hàng (từng item)
   * POST /purchase-orders/:id/items/:itemId/receive
   */
  @Post(':id/items/:itemId/receive')
  async receiveItem(
    @Param('id', ParseIntPipe) orderId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: ReceiveItemDto,
    @Req() req: any,
  ) {
    const createdBy = req.user?.adminId || req.user?.id || req.user?.sub;
    return this.purchaseOrdersService.receiveItem(
      orderId,
      itemId,
      dto,
      createdBy,
    );
  }

  /**
   * Nhận toàn bộ hàng
   * POST /purchase-orders/:id/receive-all
   */
  @Post(':id/receive-all')
  async receiveAll(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const createdBy = req.user?.adminId || req.user?.id || req.user?.sub;
    return this.purchaseOrdersService.receiveAll(id, createdBy);
  }

  /**
   * Hủy đơn nhập hàng
   * POST /purchase-orders/:id/cancel
   */
  @Post(':id/cancel')
  async cancel(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrdersService.cancel(id);
  }

  /**
   * Thêm item vào đơn nhập hàng
   * POST /purchase-orders/:id/items
   */
  @Post(':id/items')
  async addItem(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: AddItemDto,
  ) {
    return this.purchaseOrdersService.addItem(orderId, dto);
  }

  /**
   * Xóa item khỏi đơn nhập hàng
   * DELETE /purchase-orders/:id/items/:itemId
   */
  @Delete(':id/items/:itemId')
  async removeItem(
    @Param('id', ParseIntPipe) orderId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.purchaseOrdersService.removeItem(orderId, itemId);
  }
}

