import { Controller, Param, ParseIntPipe, Post, Patch, BadRequestException } from "@nestjs/common";
import { OrderService } from "./order.service";
import { Request, Body } from "@nestjs/common";
import { CreateOrderDto } from "./DTO/order.dto";
import { OrderStatus } from "./enum/order-status.enum";
import { Get, Query } from "@nestjs/common";




@Controller('orders')
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
}