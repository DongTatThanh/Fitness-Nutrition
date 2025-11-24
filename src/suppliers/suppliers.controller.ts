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
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Controller('suppliers')
@UseGuards(AuthGuard('admin-jwt'))
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  /**
   * Lấy danh sách nhà cung cấp
   * GET /suppliers?page=1&limit=20&isActive=true
   */
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.suppliersService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    );
  }

  /**
   * Lấy danh sách nhà cung cấp đang hoạt động (cho dropdown)
   * GET /suppliers/active
   */
  @Get('active')
  async findActive() {
    return this.suppliersService.findActive();
  }

  /**
   * Lấy chi tiết nhà cung cấp
   * GET /suppliers/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findOne(id);
  }

  /**
   * Tạo nhà cung cấp mới
   * POST /suppliers
   */
  @Post()
  async create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  /**
   * Cập nhật nhà cung cấp
   * PUT /suppliers/:id
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  /**
   * Xóa nhà cung cấp
   * DELETE /suppliers/:id
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.remove(id);
  }
}

