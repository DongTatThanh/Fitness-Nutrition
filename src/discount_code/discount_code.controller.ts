import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from "@nestjs/common";
import { DiscountCodeService } from "./discount_code.service";

@Controller('discount-codes')
export class DiscountCodeController {
    constructor(private readonly discountCodeService: DiscountCodeService) {}

    // Lấy danh sách tất cả mã giảm giá
    @Get()
    async findAll() {
        return this.discountCodeService.findAll();
    }

    // Lấy danh sách mã giảm giá còn hiệu lực
    @Get('active')
    async findActiveDiscountCodes() {
        return this.discountCodeService.findActiveDiscountCodes();
    }

    // Tìm mã giảm giá theo code
    @Get(':code')
    async findByCode(@Param('code') code: string) {
        return this.discountCodeService.findByCode(code);
    }

    // Tạo mã giảm giá mới
    @Post()
    async create(@Body() createDiscountCodeDto: any) {
        return this.discountCodeService.create(createDiscountCodeDto);
    }

    // Validate và sử dụng mã giảm giá
    @Post('validate')
    async validateAndUseCode(@Body('code') code: string) {
        return this.discountCodeService.validateAndUseCode(code);
    }

    // Cập nhật mã giảm giá
    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDiscountCodeDto: any
    ) {
        return this.discountCodeService.update(id, updateDiscountCodeDto);
    }

    // Xóa mã giảm giá (soft delete)
    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.discountCodeService.remove(id);
    }

    // Hard delete - xóa hoàn toàn
    @Delete(':id/hard')
    async hardDelete(@Param('id', ParseIntPipe) id: number) {
        return this.discountCodeService.hardDelete(id);
    }
}
      