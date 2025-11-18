import { Controller, Get, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
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

    // API CHI TIẾT - Lấy doanh thu theo ngày (trong khoảng thời gian)
    @Get('revenue-by-day')
    async getRevenueByDay(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.dashboardService.getRevenueByDay(startDate, endDate);
    }

    // API CHI TIẾT - Lấy chi tiết sản phẩm theo ID (doanh số, đánh giá, lượt xem)
    @Get('product-details/:id')
    async getProductDetails(@Query('id') id: string) {
        return this.dashboardService.getProductDetails(parseInt(id));
    }

    // API CHI TIẾT - Lấy danh sách đơn hàng theo trạng thái cụ thể
    @Get('order-details-by-status/:status')
    async getOrderDetailsByStatus(
        @Query('status') status: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        const pageNum = page ? parseInt(page) : 1;
        const limitNum = limit ? parseInt(limit) : 20;
        return this.dashboardService.getOrderDetailsByStatus(status, pageNum, limitNum);
    }

    // API CHI TIẾT - Lấy khách hàng theo tháng với chi tiết đơn hàng
    @Get('customers-by-month')
    async getCustomersByMonth(@Query('months') months?: string) {
        const monthsNum = months ? parseInt(months) : 6;
        return this.dashboardService.getCustomersByMonth(monthsNum);
    }

    // API CHI TIẾT - Lấy chi tiết danh mục với danh sách sản phẩm
    @Get('category-details/:categoryId')
    async getCategoryDetails(@Query('categoryId') categoryId: string) {
        return this.dashboardService.getCategoryDetails(parseInt(categoryId));
    }
}
