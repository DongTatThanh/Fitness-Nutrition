import { Controller, Get, Post, Delete, Param, Query, Request, Body, ParseIntPipe } from '@nestjs/common';
import { ProductViewService } from './product-view.service';

@Controller('product-views')
export class ProductViewController {
    constructor(private readonly productViewService: ProductViewService) {}

    // Thêm sản phẩm vào lịch sử xem (với body)
    @Post()
    async trackView(
        @Request() req,
        @Body('productId', ParseIntPipe) productId: number
    ) {
        const userId = req.user?.id || null;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        
        const view = await this.productViewService.addView(userId, productId, ipAddress, userAgent);
        
        return {
            success: true,
            message: 'Đã thêm vào lịch sử xem',
            data: view
        };
    }

    // Thêm sản phẩm vào lịch sử xem (với URL param)
    @Post(':productId')
    async addView(
        @Request() req,
        @Param('productId', ParseIntPipe) productId: number
    ) {
        const userId = req.user?.id || null;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        
        const view = await this.productViewService.addView(userId, productId, ipAddress, userAgent);
        
        return {
            success: true,
            message: 'Đã thêm vào lịch sử xem',
            data: view
        };
    }

    // Lấy lịch sử xem của user
    @Get('history')
    async getHistory(
        @Request() req,
        @Query('limit') limit?: string
    ) {
        const userId = req.user?.id;
        if (!userId) {
            return { success: true, count: 0, data: [] };
        }
        const limitNum = limit ? parseInt(limit) : 20;
        const history = await this.productViewService.getUserViewHistory(userId, limitNum);
        
        return {
            success: true,
            count: history.length,
            data: history
        };
    }

    // Xóa toàn bộ lịch sử
    @Delete('clear')
    async clearHistory(@Request() req) {
        const userId = req.user?.id;
        if (!userId) {
            return { success: false, message: 'Yêu cầu đăng nhập' };
        }
        await this.productViewService.clearHistory(userId);
        
        return {
            success: true,
            message: 'Đã xóa toàn bộ lịch sử xem'
        };
    }

    // Lấy số lượt xem của sản phẩm
    @Get('count/:productId')
    async getViewCount(@Param('productId', ParseIntPipe) productId: number) {
        const count = await this.productViewService.getProductViewCount(productId);
        
        return {
            success: true,
            productId,
            viewCount: count
        };
    }

    // Xóa một sản phẩm khỏi lịch sử
    @Delete(':productId')
    async removeView(
        @Request() req,
        @Param('productId', ParseIntPipe) productId: number
    ) {
        const userId = req.user?.id;
        if (!userId) {
            return { success: false, message: 'Yêu cầu đăng nhập' };
        }
        await this.productViewService.removeView(userId, productId);
        
        return {
            success: true,
            message: 'Đã xóa khỏi lịch sử xem'
        };
    }
}
