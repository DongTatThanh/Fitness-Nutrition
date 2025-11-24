import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InventoryService } from './inventory.service';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { TransactionType } from './inventory-transaction.entity';

@Controller('inventory')
@UseGuards(AuthGuard('admin-jwt'))
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Lấy lịch sử giao dịch kho
   * GET /inventory/transactions?page=1&limit=20&productId=1&transactionType=purchase
   */
  @Get('transactions')
  async getTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('productId') productId?: string,
    @Query('variantId') variantId?: string,
    @Query('transactionType') transactionType?: TransactionType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.inventoryService.getTransactions(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      productId ? Number(productId) : undefined,
      variantId ? Number(variantId) : undefined,
      transactionType,
      startDate,
      endDate,
    );
  }

  /**
   * Lấy chi tiết giao dịch
   * GET /inventory/transactions/:id
   */
  @Get('transactions/:id')
  async getTransaction(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.getTransaction(id);
  }

  /**
   * Tạo giao dịch kho mới
   * POST /inventory/transactions
   */
  @Post('transactions')
  async createTransaction(
    @Body() dto: CreateInventoryTransactionDto,
    @Req() req: any,
  ) {
    const createdBy = req.user?.adminId || req.user?.id || req.user?.sub;
    return this.inventoryService.createTransaction(dto, createdBy);
  }

  /**
   * Điều chỉnh tồn kho thủ công
   * POST /inventory/adjust/:productId
   */
  @Post('adjust/:productId')
  async adjustInventory(
    @Param('productId', ParseIntPipe) productId: number,
    @Body('quantity') quantity: number,
    @Req() req: any,
    @Body('notes') notes?: string,
    @Body('variantId') variantId?: number,
  ) {
    const createdBy = req.user?.adminId || req.user?.id || req.user?.sub;
    return this.inventoryService.adjustInventory(
      productId,
      quantity,
      notes,
      variantId,
      createdBy,
    );
  }

  /**
   * Lấy báo cáo tồn kho
   * GET /inventory/report?productId=1
   */
  @Get('report')
  async getInventoryReport(@Query('productId') productId?: string) {
    return this.inventoryService.getInventoryReport(
      productId ? Number(productId) : undefined,
    );
  }
}

