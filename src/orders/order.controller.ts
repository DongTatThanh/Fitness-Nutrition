import { Controller, Param, ParseIntPipe, Post, Patch, BadRequestException } from "@nestjs/common";
import { OrderService } from "./order.service";
import { Request, Body } from "@nestjs/common";
import { CreateOrderDto } from "./DTO/order.dto";
import { OrderStatus } from "./enum/order-status.enum";
import { Get, Query } from "@nestjs/common";




@Controller('api/orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    // tạo đơn hàng mới từ giỏ hàng 

    @Post()
    async createOrder
    (@Request() req,
     @Body() createOrderDto: CreateOrderDto)
      {
        const userId = req.user?.id || 1;
        return this.orderService.createOrder(userId, createOrderDto);
    }

    // lấy danh sách đơn hàng của user 
    @Get()
    async getUserOrders(
        @Request() req,
        @Query('status') status?: OrderStatus
    ) {
        const userId = req.user?.id ;
        return this.orderService.getOrdersByUser(userId, status);
    }

    // API: Lấy đơn hàng gần đây
    @Get('recent')
    async getRecentOrders(@Query('limit') limit: string = '10') {
        const orders = await this.orderService['orderRepository']
            .createQueryBuilder('order')
            .orderBy('order.order_date', 'DESC')
            .take(Number(limit))
            .getMany();
        
        return orders.map(order => ({
            ...order,
            id: order.order_number || order.id.toString()
        }));
    }

    // lấy chi tiết đơn hàng theo ID 

    @Get(':id')

    async getOrderById(
        @Request() req,
        @Param('id', ParseIntPipe)orderId: number
    ) {
        const userId = req.user?.id ;
        return this.orderService.getOrderById(orderId, userId);
    }

   // lấy đơn hàng theo order_number
   @Get('number/:order_number')
    async getOrderByNumber(
        @Request() req,
        @Param('order_number') orderNumber: string
    ) {
        const userId = req.user?.id ;
        return this.orderService.getOrderByNumber(orderNumber, userId);
    }

    // Hủy đơn hàng
    @Patch(':id/cancel')
    async cancelOrder(
        @Request() req,
        @Param('id', ParseIntPipe) orderId: number,
        @Body() body?: { reason?: string }
    ) {
        try {
            const userId = req.user?.id || 1;
            const reason = body?.reason;
            
            const cancelledOrder = await this.orderService.cancelOrder(orderId, userId, reason);
            
            return {
                success: true,
                message: 'Đã hủy đơn hàng thành công',
                data: cancelledOrder
            };
        } catch (error) {
            throw new BadRequestException(error.message || 'Không thể hủy đơn hàng');
        }
    }

    // API Admin: Lấy danh sách đơn hàng phân trang
    @Get('admin/list/all')
    async getAdminOrders(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('status') status?: string,
        @Query('payment_status') paymentStatus?: string,
        @Query('search') search?: string
    ) {
        const skip = (Number(page) - 1) * Number(limit);
        let query = this.orderService['orderRepository']
            .createQueryBuilder('order')
            .skip(skip)
            .take(Number(limit));

        if (status) {
            query = query.where('order.status = :status', { status });
        }

        if (paymentStatus) {
            query = query.andWhere('order.payment_status = :paymentStatus', { paymentStatus });
        }

        if (search) {
            query = query.andWhere('order.order_number LIKE :search OR order.customer_name LIKE :search', {
                search: `%${search}%`
            });
        }

        query = query.orderBy('order.order_date', 'DESC');

        const [orders, total] = await query.getManyAndCount();

        return {
            data: orders,
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
        };
    }
}