import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from '../orders/order.entity';
import { User } from '../entities/user.entity';
import { Product } from '../products/product.entity';
import { OrderItem } from '../orders/orderItem.entity';

@Injectable()
export class DashboardService {
    private readonly logger = new Logger(DashboardService.name);

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
        try {

            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // Thống kê tổng quan (tất cả thời gian)
            const [totalRevenueResult, totalOrders, totalCustomers, totalProducts] = await Promise.all([
                this.orderRepository
                    .createQueryBuilder('order')
                    .select('SUM(order.total_amount)', 'total')
                    .where('order.payment_status = :status', { status: 'paid' })
                    .getRawOne(),
                this.orderRepository.count(),
                this.userRepository.count(),
                this.productRepository.count({ where: { status: 'active' } })
            ]);

            // Thống kê tháng này
            const [thisMonthRevenue, thisMonthOrders, thisMonthCustomers] = await Promise.all([
                this.orderRepository
                    .createQueryBuilder('order')
                    .select('SUM(order.total_amount)', 'total')
                    .where('order.payment_status = :status', { status: 'paid' })
                    .andWhere('order.order_date >= :date', { date: thisMonthStart })
                    .getRawOne(),
                this.orderRepository
                    .createQueryBuilder('order')
                    .where('order.order_date >= :date', { date: thisMonthStart })
                    .getCount(),
                this.userRepository
                    .createQueryBuilder('user')
                    .where('user.created_at >= :date', { date: thisMonthStart })
                    .getCount()
            ]);

            // Thống kê tháng trước
            const [lastMonthRevenue, lastMonthOrders, lastMonthCustomers] = await Promise.all([
                this.orderRepository
                    .createQueryBuilder('order')
                    .select('SUM(order.total_amount)', 'total')
                    .where('order.payment_status = :status', { status: 'paid' })
                    .andWhere('order.order_date BETWEEN :start AND :end', { 
                        start: lastMonthStart, 
                        end: lastMonthEnd 
                    })
                    .getRawOne(),
                this.orderRepository
                    .createQueryBuilder('order')
                    .where('order.order_date BETWEEN :start AND :end', { 
                        start: lastMonthStart, 
                        end: lastMonthEnd 
                    })
                    .getCount(),
                this.userRepository
                    .createQueryBuilder('user')
                    .where('user.created_at BETWEEN :start AND :end', { 
                        start: lastMonthStart, 
                        end: lastMonthEnd 
                    })
                    .getCount()
            ]);

            // Thống kê hôm nay
            const [todayRevenue, todayOrders] = await Promise.all([
                this.orderRepository
                    .createQueryBuilder('order')
                    .select('SUM(order.total_amount)', 'total')
                    .where('order.payment_status = :status', { status: 'paid' })
                    .andWhere('order.order_date >= :date', { date: todayStart })
                    .getRawOne(),
                this.orderRepository
                    .createQueryBuilder('order')
                    .where('order.order_date >= :date', { date: todayStart })
                    .getCount()
            ]);

            // Đơn hàng đang chờ xử lý
            const pendingOrders = await this.orderRepository
                .createQueryBuilder('order')
                .where('order.status IN (:...statuses)', { 
                    statuses: ['PENDING', 'CONFIRMED', 'PROCESSING'] 
                })
                .getCount();

            // Tính phần trăm tăng trưởng
            const calculateGrowth = (current: number, previous: number): number => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return Math.round(((current - previous) / previous) * 100 * 100) / 100;
            };

            const thisMonthRevenueValue = parseFloat(thisMonthRevenue?.total || '0');
            const lastMonthRevenueValue = parseFloat(lastMonthRevenue?.total || '0');

            return {
                // Tổng quan
                total_revenue: parseFloat(totalRevenueResult?.total || '0'),
                total_orders: totalOrders,
                total_customers: totalCustomers,
                total_products: totalProducts,
                pending_orders: pendingOrders,

                // Tháng này
                this_month: {
                    revenue: thisMonthRevenueValue,
                    orders: thisMonthOrders,
                    customers: thisMonthCustomers,
                },

                // Tháng trước
                last_month: {
                    revenue: lastMonthRevenueValue,
                    orders: lastMonthOrders,
                    customers: lastMonthCustomers,
                },

                // Hôm nay
                today: {
                    revenue: parseFloat(todayRevenue?.total || '0'),
                    orders: todayOrders,
                },

                // Tăng trưởng (so với tháng trước)
                growth: {
                    revenue: calculateGrowth(thisMonthRevenueValue, lastMonthRevenueValue),
                    orders: calculateGrowth(thisMonthOrders, lastMonthOrders),
                    customers: calculateGrowth(thisMonthCustomers, lastMonthCustomers),
                },
            };
        } catch (error) {
            this.logger.error('Error fetching dashboard stats', error.stack);
            throw error;
        }
    }

    // Doanh thu theo tháng (với so sánh năm trước)
    async getRevenueByMonth(months: number = 12) {
        try {

            const result = await this.orderRepository
                .createQueryBuilder('order')
                .select('DATE_FORMAT(order.order_date, "%Y-%m") as month')
                .addSelect('YEAR(order.order_date)', 'year')
                .addSelect('MONTH(order.order_date)', 'month_num')
                .addSelect('SUM(order.total_amount)', 'revenue')
                .addSelect('COUNT(order.id)', 'orders')
                .addSelect('AVG(order.total_amount)', 'avg_order_value')
                .where('order.payment_status = :status', { status: 'paid' })
                .andWhere('order.order_date >= DATE_SUB(NOW(), INTERVAL :months MONTH)', { months })
                .groupBy('month')
                .addGroupBy('year')
                .addGroupBy('month_num')
                .orderBy('year', 'ASC')
                .addOrderBy('month_num', 'ASC')
                .getRawMany();

            return result.map(item => ({
                month: item.month,
                year: parseInt(item.year),
                month_num: parseInt(item.month_num),
                revenue: parseFloat(item.revenue || '0'),
                orders: parseInt(item.orders || '0'),
                avg_order_value: parseFloat(item.avg_order_value || '0'),
            }));
        } catch (error) {
            this.logger.error('Error fetching revenue by month', error.stack);
            throw error;
        }
    }

    // Top sản phẩm bán chạy (với thêm thông tin)
    async getTopProducts(limit: number = 10) {
        try {

            const result = await this.orderItemRepository
                .createQueryBuilder('item')
                .select('item.product_id', 'product_id')
                .addSelect('item.product_name', 'product_name')
                .addSelect('SUM(item.quantity)', 'total_sold')
                .addSelect('SUM(item.total_price)', 'total_revenue')
                .addSelect('AVG(item.unit_price)', 'avg_price')
                .addSelect('COUNT(DISTINCT item.order_id)', 'order_count')
                .innerJoin('item.order', 'order')
                .where('order.payment_status = :status', { status: 'paid' })
                .groupBy('item.product_id')
                .addGroupBy('item.product_name')
                .orderBy('total_sold', 'DESC')
                .limit(limit)
                .getRawMany();

            return result.map((item, index) => ({
                rank: index + 1,
                product_id: item.product_id ? item.product_id.toString() : 'N/A',
                product_name: item.product_name || 'Unknown Product',
                total_sold: parseInt(item.total_sold || '0'),
                total_revenue: parseFloat(item.total_revenue || '0'),
                avg_price: parseFloat(item.avg_price || '0'),
                order_count: parseInt(item.order_count || '0'),
            }));
        } catch (error) {
            this.logger.error('Error fetching top products', error.stack);
            throw error;
        }
    }

    // Đơn hàng theo trạng thái (với tỷ lệ phần trăm)
    async getOrdersByStatus() {
        try {

            const result = await this.orderRepository
                .createQueryBuilder('order')
                .select('order.status', 'status')
                .addSelect('COUNT(order.id)', 'count')
                .addSelect('SUM(order.total_amount)', 'total_amount')
                .groupBy('order.status')
                .getRawMany();

            const total = result.reduce((sum, item) => sum + parseInt(item.count || '0'), 0);

            return result.map(item => {
                const count = parseInt(item.count || '0');
                return {
                    status: item.status,
                    count: count,
                    percentage: total > 0 ? Math.round((count / total) * 100 * 100) / 100 : 0,
                    total_amount: parseFloat(item.total_amount || '0'),
                };
            });
        } catch (error) {
            this.logger.error('Error fetching orders by status', error.stack);
            throw error;
        }
    }

    // Doanh thu theo danh mục (cải thiện)
    async getRevenueByCategory() {
        try {

            const result = await this.orderItemRepository
                .createQueryBuilder('item')
                .select('item.product_name', 'product_name')
                .addSelect('COUNT(DISTINCT item.order_id)', 'total_orders')
                .addSelect('SUM(item.quantity)', 'total_quantity')
                .addSelect('SUM(item.total_price)', 'total_revenue')
                .addSelect('AVG(item.unit_price)', 'avg_price')
                .innerJoin('item.order', 'order')
                .where('order.payment_status = :status', { status: 'paid' })
                .groupBy('item.product_name')
                .orderBy('total_revenue', 'DESC')
                .limit(20)
                .getRawMany();

            const totalRevenue = result.reduce((sum, item) => 
                sum + parseFloat(item.total_revenue || '0'), 0
            );

            return result.map((item, index) => {
                const revenue = parseFloat(item.total_revenue || '0');
                return {
                    rank: index + 1,
                    category: item.product_name,
                    total_orders: parseInt(item.total_orders || '0'),
                    total_quantity: parseInt(item.total_quantity || '0'),
                    total_revenue: revenue,
                    avg_price: parseFloat(item.avg_price || '0'),
                    revenue_percentage: totalRevenue > 0 ? 
                        Math.round((revenue / totalRevenue) * 100 * 100) / 100 : 0,
                };
            });
        } catch (error) {
            this.logger.error('Error fetching revenue by category', error.stack);
            throw error;
        }
    }

    // Khách hàng mới gần đây (với thêm thống kê)
    async getNewCustomers(days: number = 30) {
        try {

            const dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - days);

            const customers = await this.userRepository
                .createQueryBuilder('user')
                .where('user.created_at >= :date', { date: dateFrom })
                .orderBy('user.created_at', 'DESC')
                .take(50)
                .getMany();

            // Thống kê theo ngày
            const customersByDay = await this.userRepository
                .createQueryBuilder('user')
                .select('DATE(user.created_at) as date')
                .addSelect('COUNT(user.user_id)', 'count')
                .where('user.created_at >= :date', { date: dateFrom })
                .groupBy('date')
                .orderBy('date', 'ASC')
                .getRawMany();

            return {
                total_new_customers: customers.length,
                customers: customers.map(user => ({
                    user_id: user.user_id,
                    username: user.username,
                    email: user.email,
                    created_at: user.created_at,
                })),
                daily_stats: customersByDay.map(item => ({
                    date: item.date,
                    count: parseInt(item.count || '0'),
                })),
            };
        } catch (error) {
            this.logger.error('Error fetching new customers', error.stack);
            throw error;
        }
    }

    // ===== API CHI TIẾT =====

    // 1. Lấy doanh thu chi tiết theo ngày
    async getRevenueByDay(startDate?: string, endDate?: string) {
        try {

            const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
            const end = endDate ? new Date(endDate) : new Date();

            const revenueByDay = await this.orderRepository
                .createQueryBuilder('order')
                .select('DATE(order.order_date)', 'date')
                .addSelect('COUNT(order.id)', 'total_orders')
                .addSelect('SUM(order.total_amount)', 'total_revenue')
                .addSelect('AVG(order.total_amount)', 'avg_order_value')
                .addSelect('COUNT(DISTINCT order.user_id)', 'unique_customers')
                .where('order.order_date BETWEEN :start AND :end', { start, end })
                .andWhere('order.payment_status = :status', { status: 'paid' })
                .groupBy('DATE(order.order_date)')
                .orderBy('date', 'ASC')
                .getRawMany();

            // Trả về array trực tiếp để frontend dễ xử lý
            return revenueByDay.map(item => ({
                date: item.date,
                orders: parseInt(item.total_orders || '0'),
                revenue: parseFloat(item.total_revenue || '0'),
                avg_value: parseFloat(item.avg_order_value || '0'),
                customers: parseInt(item.unique_customers || '0'),
            }));
        } catch (error) {
            this.logger.error('Error fetching revenue by day', error.stack);
            throw error;
        }
    }

    // 2. Lấy chi tiết sản phẩm theo ID
    async getProductDetails(productId: number) {
        try {

            const product = await this.productRepository.findOne({
                where: { id: productId },
                relations: ['category', 'brand'],
            });

            if (!product) {
                throw new Error('Product not found');
            }

            // Thống kê bán hàng
            const salesStats = await this.orderItemRepository
                .createQueryBuilder('item')
                .leftJoin('item.order', 'order')
                .select('COUNT(DISTINCT order.id)', 'total_orders')
                .addSelect('SUM(item.quantity)', 'total_quantity')
                .addSelect('SUM(item.total_price)', 'total_revenue')
                .addSelect('AVG(item.unit_price)', 'avg_price')
                .where('item.product_id = :productId', { productId })
                .andWhere('order.payment_status = :status', { status: 'paid' })
                .getRawOne();

            // Doanh thu theo tháng (6 tháng gần nhất)
            const revenueByMonth = await this.orderItemRepository
                .createQueryBuilder('item')
                .leftJoin('item.order', 'order')
                .select('DATE_FORMAT(order.order_date, "%Y-%m")', 'month')
                .addSelect('SUM(item.quantity)', 'quantity')
                .addSelect('SUM(item.total_price)', 'revenue')
                .where('item.product_id = :productId', { productId })
                .andWhere('order.payment_status = :status', { status: 'paid' })
                .andWhere('order.order_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)')
                .groupBy('month')
                .orderBy('month', 'DESC')
                .getRawMany();

            return {
                product: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    stock: product.inventory_quantity,
                    status: product.status,
                    category: product.category?.name,
                    brand: product.brand?.name,
                },
                sales_stats: {
                    total_orders: parseInt(salesStats.total_orders || '0'),
                    total_sold: parseInt(salesStats.total_quantity || '0'),
                    total_revenue: parseFloat(salesStats.total_revenue || '0'),
                    avg_price: parseFloat(salesStats.avg_price || '0'),
                },
                monthly_performance: revenueByMonth.map(item => ({
                    month: item.month,
                    quantity: parseInt(item.quantity || '0'),
                    revenue: parseFloat(item.revenue || '0'),
                })),
            };
        } catch (error) {
            this.logger.error(`Error fetching product details for ${productId}`, error.stack);
            throw error;
        }
    }

    // 3. Lấy danh sách đơn hàng theo trạng thái cụ thể
    async getOrderDetailsByStatus(status: string, page: number = 1, limit: number = 20) {
        try {

            const skip = (page - 1) * limit;

            const [orders, total] = await this.orderRepository.findAndCount({
                where: { status: status as any },
                order: { order_date: 'DESC' },
                relations: ['user'],
                skip,
                take: limit,
            });

            const ordersWithItems = await Promise.all(
                orders.map(async (order) => {
                    const items = await this.orderItemRepository.find({
                        where: { order_id: order.id },
                    });
                    return {
                        ...order,
                        items_count: items.length,
                        items: items,
                    };
                })
            );

            return {
                status,
                pagination: {
                    page,
                    limit,
                    total,
                    total_pages: Math.ceil(total / limit),
                },
                orders: ordersWithItems.map(order => ({
                    id: order.id,
                    order_number: order.order_number,
                    customer: {
                        id: order.user?.id,
                        name: order.user?.username,
                        email: order.user?.email,
                    },
                    total_amount: order.total_amount,
                    payment_status: order.payment_status,
                    order_date: order.order_date,
                    items_count: order.items_count,
                    items: order.items,
                })),
            };
        } catch (error) {
            this.logger.error(`Error fetching orders by status ${status}`, error.stack);
            throw error;
        }
    }

    // 4. Lấy khách hàng theo tháng với chi tiết đơn hàng
    async getCustomersByMonth(months: number = 6) {
        try {

            const customersByMonth = await this.userRepository
                .createQueryBuilder('user')
                .select('DATE_FORMAT(user.created_at, "%Y-%m")', 'month')
                .addSelect('COUNT(user.id)', 'new_customers')
                .where('user.created_at >= DATE_SUB(NOW(), INTERVAL :months MONTH)', { months })
                .groupBy('month')
                .orderBy('month', 'DESC')
                .getRawMany();

            // Lấy thống kê đơn hàng cho từng tháng
            const ordersStats = await Promise.all(
                customersByMonth.map(async (item) => {
                    const monthStart = new Date(item.month + '-01');
                    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59);

                    const stats = await this.orderRepository
                        .createQueryBuilder('order')
                        .select('COUNT(order.id)', 'total_orders')
                        .addSelect('SUM(order.total_amount)', 'total_revenue')
                        .addSelect('COUNT(DISTINCT order.user_id)', 'active_customers')
                        .where('order.order_date BETWEEN :start AND :end', {
                            start: monthStart,
                            end: monthEnd,
                        })
                        .andWhere('order.payment_status = :status', { status: 'paid' })
                        .getRawOne();

                    return {
                        month: item.month,
                        new_customers: parseInt(item.new_customers || '0'),
                        active_customers: parseInt(stats.active_customers || '0'),
                        total_orders: parseInt(stats.total_orders || '0'),
                        total_revenue: parseFloat(stats.total_revenue || '0'),
                    };
                })
            );

            return {
                period_months: months,
                monthly_data: ordersStats,
            };
        } catch (error) {
            this.logger.error('Error fetching customers by month', error.stack);
            throw error;
        }
    }

    // 5. Lấy chi tiết danh mục với danh sách sản phẩm
    async getCategoryDetails(categoryId: number) {
        try {

            // Lấy thông tin danh mục
            const products = await this.productRepository.find({
                where: { category_id: categoryId },
                relations: ['brand'],
            });

            if (products.length === 0) {
                return {
                    category_id: categoryId,
                    message: 'No products found in this category',
                    products: [],
                };
            }

            // Thống kê doanh thu danh mục
            const categoryStats = await this.orderItemRepository
                .createQueryBuilder('item')
                .leftJoin('item.order', 'order')
                .leftJoin('item.product', 'product')
                .select('COUNT(DISTINCT order.id)', 'total_orders')
                .addSelect('SUM(item.quantity)', 'total_quantity')
                .addSelect('SUM(item.total_price)', 'total_revenue')
                .addSelect('AVG(item.unit_price)', 'avg_price')
                .where('product.category_id = :categoryId', { categoryId })
                .andWhere('order.payment_status = :status', { status: 'paid' })
                .getRawOne();

            // Lấy top sản phẩm trong danh mục
            const topProducts = await this.orderItemRepository
                .createQueryBuilder('item')
                .leftJoin('item.order', 'order')
                .leftJoin('item.product', 'product')
                .select('product.id', 'product_id')
                .addSelect('product.name', 'product_name')
                .addSelect('SUM(item.quantity)', 'total_sold')
                .addSelect('SUM(item.total_price)', 'total_revenue')
                .where('product.category_id = :categoryId', { categoryId })
                .andWhere('order.payment_status = :status', { status: 'paid' })
                .groupBy('product.id')
                .orderBy('total_sold', 'DESC')
                .limit(10)
                .getRawMany();

            return {
                category_id: categoryId,
                stats: {
                    total_products: products.length,
                    total_orders: parseInt(categoryStats.total_orders || '0'),
                    total_quantity_sold: parseInt(categoryStats.total_quantity || '0'),
                    total_revenue: parseFloat(categoryStats.total_revenue || '0'),
                    avg_price: parseFloat(categoryStats.avg_price || '0'),
                },
                top_products: topProducts.map((item, index) => ({
                    rank: index + 1,
                    product_id: item.product_id,
                    product_name: item.product_name,
                    total_sold: parseInt(item.total_sold || '0'),
                    total_revenue: parseFloat(item.total_revenue || '0'),
                })),
                all_products: products.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    stock: p.inventory_quantity,
                    status: p.status,
                    brand: p.brand?.name,
                })),
            };
        } catch (error) {
            this.logger.error(`Error fetching category details for ${categoryId}`, error.stack);
            throw error;
        }
    }
}
