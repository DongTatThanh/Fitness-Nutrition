import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    // Lấy thống kê tổng quan
    @Get('stats')
    async getDashboardStats() {
        return this.dashboardService.getDashboardStats();
    }

    // Lấy doanh thu theo tháng
    @Get('revenue-by-month')
    async getRevenueByMonth(@Query('months') months?: string) {
        const monthsNum = months ? parseInt(months) : 12;
        return this.dashboardService.getRevenueByMonth(monthsNum);
    }

    // Lấy top sản phẩm bán chạy
    @Get('top-products')
    async getTopProducts(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit) : 10;
        return this.dashboardService.getTopProducts(limitNum);
    }

    // Lấy đơn hàng theo trạng thái
    @Get('orders-by-status')
    async getOrdersByStatus() {
        return this.dashboardService.getOrdersByStatus();
    }

    // Lấy doanh thu theo danh mục
    @Get('revenue-by-category')
    async getRevenueByCategory() {
        return this.dashboardService.getRevenueByCategory();
    }

    // Lấy khách hàng mới
    @Get('new-customers')
    async getNewCustomers(@Query('days') days?: string) {
        const daysNum = days ? parseInt(days) : 30;
        return this.dashboardService.getNewCustomers(daysNum);
    }
}
