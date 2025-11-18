import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/order.entity';
import { User } from '../entities/user.entity';
import { Product } from '../products/product.entity';
import { OrderItem } from '../orders/orderItem.entity';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(OrderItem)
        private orderItemRepository: Repository<OrderItem>,
    ) {}

    // Thống kê tổng quan
    async getDashboardStats() {
        // Tổng doanh thu (chỉ đơn đã thanh toán)
        const totalRevenueResult = await this.orderRepository
            .createQueryBuilder('order')
            .select('SUM(order.total_amount)', 'total')
            .where('order.payment_status = :status', { status: 'paid' })
            .getRawOne();

        // Tổng số đơn hàng
        const totalOrders = await this.orderRepository.count();

        // Tổng số khách hàng (users)
        const totalCustomers = await this.userRepository.count();

        // Tổng số sản phẩm
        const totalProducts = await this.productRepository.count({
            where: { status: 'active' }
        });

        // Tính tăng trưởng so với tháng trước
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const lastMonthRevenue = await this.orderRepository
            .createQueryBuilder('order')
            .select('SUM(order.total_amount)', 'total')
            .where('order.payment_status = :status', { status: 'paid' })
            .andWhere('order.order_date >= :date', { date: lastMonth })
            .getRawOne();

        const lastMonthOrders = await this.orderRepository
            .createQueryBuilder('order')
            .where('order.order_date >= :date', { date: lastMonth })
            .getCount();

        const lastMonthCustomers = await this.userRepository
            .createQueryBuilder('user')
            .where('user.created_at >= :date', { date: lastMonth })
            .getCount();

        return {
            total_revenue: parseFloat(totalRevenueResult?.total || '0'),
            total_orders: totalOrders,
            total_customers: totalCustomers,
            total_products: totalProducts,
            revenue_growth: lastMonthRevenue?.total ? 
                ((parseFloat(totalRevenueResult?.total || '0') - parseFloat(lastMonthRevenue.total)) / parseFloat(lastMonthRevenue.total) * 100) : 0,
            orders_growth: lastMonthOrders ? 
                ((totalOrders - lastMonthOrders) / lastMonthOrders * 100) : 0,
            customers_growth: lastMonthCustomers ?
                ((totalCustomers - lastMonthCustomers) / lastMonthCustomers * 100) : 0,
        };
    }

    // Doanh thu theo tháng
    async getRevenueByMonth(months: number = 12) {
        const result = await this.orderRepository
            .createQueryBuilder('order')
            .select('DATE_FORMAT(order.order_date, "%Y-%m") as month')
            .addSelect('SUM(order.total_amount)', 'revenue')
            .addSelect('COUNT(order.id)', 'orders')
            .where('order.payment_status = :status', { status: 'paid' })
            .andWhere('order.order_date >= DATE_SUB(NOW(), INTERVAL :months MONTH)', { months })
            .groupBy('month')
            .orderBy('month', 'ASC')
            .getRawMany();

        return result.map(item => ({
            month: item.month,
            revenue: parseFloat(item.revenue || '0'),
            orders: parseInt(item.orders || '0'),
        }));
    }

    // Top sản phẩm bán chạy
    async getTopProducts(limit: number = 10) {
        const result = await this.orderItemRepository
            .createQueryBuilder('item')
            .select('item.product_id', 'product_id')
            .addSelect('item.product_name', 'product_name')
            .addSelect('SUM(item.quantity)', 'total_sold')
            .addSelect('SUM(item.total_price)', 'total_revenue')
            .innerJoin('item.order', 'order')
            .where('order.payment_status = :status', { status: 'paid' })
            .groupBy('item.product_id')
            .addGroupBy('item.product_name')
            .orderBy('total_sold', 'DESC')
            .limit(limit)
            .getRawMany();

        return result.map(item => ({
            product_id: item.product_id ? item.product_id.toString() : 'N/A',
            product_name: item.product_name || 'Unknown Product',
            total_sold: parseInt(item.total_sold || '0'),
            total_revenue: parseFloat(item.total_revenue || '0'),
        }));
    }

    // Đơn hàng theo trạng thái
    async getOrdersByStatus() {
        const result = await this.orderRepository
            .createQueryBuilder('order')
            .select('order.status', 'status')
            .addSelect('COUNT(order.id)', 'count')
            .addSelect('SUM(order.total_amount)', 'total_amount')
            .groupBy('order.status')
            .getRawMany();

        return result.map(item => ({
            status: item.status,
            count: parseInt(item.count || '0'),
            total_amount: parseFloat(item.total_amount || '0'),
        }));
    }

    // Doanh thu theo danh mục
    async getRevenueByCategory() {
        const result = await this.orderItemRepository
            .createQueryBuilder('item')
            .select('item.product_name', 'product_name')
            .addSelect('COUNT(DISTINCT item.order_id)', 'total_orders')
            .addSelect('SUM(item.quantity)', 'total_quantity')
            .addSelect('SUM(item.total_price)', 'total_revenue')
            .innerJoin('item.order', 'order')
            .where('order.payment_status = :status', { status: 'paid' })
            .groupBy('item.product_name')
            .orderBy('total_revenue', 'DESC')
            .getRawMany();

        return result.map(item => ({
            category: item.product_name,
            total_orders: parseInt(item.total_orders || '0'),
            total_quantity: parseInt(item.total_quantity || '0'),
            total_revenue: parseFloat(item.total_revenue || '0'),
        }));
    }

    // Khách hàng mới gần đây
    async getNewCustomers(days: number = 30) {
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);

        const result = await this.userRepository
            .createQueryBuilder('user')
            .where('user.created_at >= :date', { date: dateFrom })
            .orderBy('user.created_at', 'DESC')
            .take(20)
            .getMany();

        return result.map(user => ({
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            created_at: user.created_at,
        }));
    }
}
