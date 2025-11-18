import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order } from "./order.entity";
import { Repository } from "typeorm";
import { OrderItem } from "./orderItem.entity";
import { CartService } from "../cart/cart.service";
import { DiscountCodeService } from "../discount_code/discount_code.service";
import { OrderStatus } from "./enum/order-status.enum";
import { PaymentStatus } from "./enum/payment-status.enum";
import { CreateOrderDto } from "./DTO/order.dto";
import { OrdersGateway } from "../WebSocket/gteway";




@Injectable()
export class OrderService
 {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemRepository: Repository<OrderItem>,
        private cartService: CartService,
        private discountCodeService: DiscountCodeService,
        private ordersGateway: OrdersGateway,
    ) {}

    // tạo mã đơn hàng
    private createOrderNumber(): string {    
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');// nếu ngắn howej 3 kí tự thì thêm 0 vào đầu
        return 'FN' + timestamp + random;
    }

    // Tính toán tổng tiền đơn hàng 
    private calculateOrderTotal(cartItems: any[], shippingFee: number = 0, discountAmount: number = 0): number
     {
        const subtotal = cartItems.reduce((total, item) => {
            return total + (parseFloat(item.price) * item.quantity);
        }, 0);

        const tax_amount = 0; // thuế để bằng không
        const total = subtotal + shippingFee + tax_amount - discountAmount;
    
        return Math.max(total, 0); // tiền không âm 
    }

    // Tạo đơn hàng mới từ giỏ hàng
    async createOrder(userId: number, createOrderDto: CreateOrderDto) 
    {
        const cartResponse = await this.cartService.getcart(userId);
        const cart = cartResponse.data || cartResponse;
         
        if (!cart || !cart.items || cart.items.length === 0) 
            {
            throw new BadRequestException('Giỏ hàng trống. Không thể tạo đơn hàng.');
        }

        // tạo mã đơn hàng
        const orderNumber = this.createOrderNumber();

        // Tính toán 
        const subtotal = cart.total;
        const shippingFee = createOrderDto.shipping_fee ;
        
        // Xử lý mã giảm giá
        let discountAmount = 0;
        let discountCode: string | null = null;
        
        if (createOrderDto.discount_code) {
            try {
                const validation = await this.discountCodeService.validateAndUseCode(createOrderDto.discount_code,
                            
                );

                
                if (validation.valid && validation.discountValue) {
                    // Tính discount amount dựa vào type
                    if (validation.discountType === 'percentage') {
                        // Giảm % trên subtotal
                        discountAmount = (subtotal * validation.discountValue) / 100;
                    } else if (validation.discountType === 'fixed') {
                        // Giảm cố định
                        discountAmount = validation.discountValue;
                    }
                    
                    discountAmount = Math.min(discountAmount, subtotal);
                    discountCode = createOrderDto.discount_code;

               
                }
            } catch (error) {
                // Nếu mã giảm giá không hợp lệ, bỏ qua và tiếp tục tạo đơn hàng
                discountAmount = 0;
                discountCode = null;

            }
        }
        //  tống sau khi trừ discount
        
        const totalAmount = this.calculateOrderTotal(cart.items, shippingFee, discountAmount);

       

        // Tạo order mới 
        const order = this.orderRepository.create
        ({
            order_number: orderNumber,
            user_id: userId,
            customer_name: createOrderDto.customer_name,
            customer_email: createOrderDto.customer_email,
            customer_phone: createOrderDto.customer_phone,
            shipping_address: createOrderDto.shipping_address,
            shipping_city: createOrderDto.shipping_city,
            shipping_district: createOrderDto.shipping_district,
            shipping_ward: createOrderDto.shipping_ward,
            shipping_postal_code: createOrderDto.shipping_postal_code,
            subtotal: subtotal,
            shipping_fee: shippingFee,
            tax_amount: 0,
            discount_amount: discountAmount,
            total_amount: totalAmount,
            status: OrderStatus.PENDING,
            payment_status: PaymentStatus.PENDING,
            notes: createOrderDto.notes,
            discount_code: discountCode || undefined,
        });

        const savedOrder = await this.orderRepository.save(order);

        // tạo order items từ cart items
        const orderItems = cart.items.map(item => {
            const unitPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
            const quantity = item.quantity;
            const totalPrice = unitPrice * quantity;

            const orderItem = new OrderItem();
            orderItem.order_id = savedOrder.id;
            orderItem.product_id = item.product.id;
            orderItem.variant_id = item.variant?.id;
            orderItem.product_name = item.product.name;
            orderItem.variant_name = item.variant?.name;
            orderItem.sku = item.product.sku;
            orderItem.quantity = quantity;
            orderItem.unit_price = unitPrice;
            orderItem.total_price = totalPrice;
            orderItem.product_image = item.product.featured_image;

            return orderItem;
        });

        await this.orderItemRepository.save(orderItems);

        // Gửi thông báo đơn hàng mới qua WebSocket
        try {
            const products = orderItems.map(item => ({
                name: item.product_name + (item.variant_name ? ` - ${item.variant_name}` : ''),
                quantity: item.quantity,
            }));

            this.ordersGateway.sendNewOrder({
                customer_name: savedOrder.customer_name,
                products: products,
                order_date: savedOrder.order_date,
                shipping_city: savedOrder.shipping_city,
                shipping_district: savedOrder.shipping_district,
                product_image: orderItems[0]?.product_image,
            });
        } catch (error) {
            // Silently fail - don't block order creation if WebSocket fails
        }

        // xóa giỏ hàng sau khi tạo đơn hàng thành công 
        // await this.cartService.clearCart(userId);

        // trả về chi tiết đơn hàng 
        return this.getOrderById(savedOrder.id, userId);
    }

    // lấy chi tiết đơn hàng theo id và người dùng 
    async getOrderById(orderId: number, userId: number)
     {
        const order = await this.orderRepository.findOne({
            where: { id: orderId, user_id: userId },
            relations: ['items', 'items.product']
        });

        if (!order) {
            throw new NotFoundException('Đơn hàng không tồn tại hoặc không thuộc về người dùng.');
        }

        return order;
    }

    // Lấy đơn hàng theo order_number
    async getOrderByNumber(orderNumber: string, userId: number)
     {
        const order = await this.orderRepository.findOne({
            where: { order_number: orderNumber, user_id: userId },
            relations: ['items', 'items.product'],
        });

        if (!order) {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        return order;
    }

    // Lấy danh sách đơn hàng của user
    async getOrdersByUser(userId: number, status?: OrderStatus) 
    {
        const where: any = { user_id: userId };
        
        if (status) {
            where.status = status;
        }

        return await this.orderRepository.find({
            where,
            relations: ['items', 'items.product'],
            order: { order_date: 'DESC' },
        });
    }

    // Cập nhật trạng thái thanh toán
    async updatePaymentStatus(orderId: number, paymentStatus: PaymentStatus) 
    {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['items'],
        });

        if (!order) {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        // Lưu trạng thái cũ để kiểm tra có thay đổi không
        const wasPending = order.payment_status === PaymentStatus.PENDING;
        const isNowPaid = paymentStatus === PaymentStatus.PAID;

        order.payment_status = paymentStatus;

        if (paymentStatus === PaymentStatus.PAID) {
            order.status = OrderStatus.CONFIRMED;
            order.confirmed_at = new Date();
        }

        const savedOrder = await this.orderRepository.save(order);

        // Gửi thông báo WebSocket khi thanh toán thành công (chuyển từ PENDING sang PAID)
        if (wasPending && isNowPaid) {
            try {
                const products = order.items.map(item => ({
                    name: item.product_name + (item.variant_name ? ` - ${item.variant_name}` : ''),
                    quantity: item.quantity,
                }));

                this.ordersGateway.sendNewOrder({
                    customer_name: savedOrder.customer_name,
                    products: products,
                    order_date: savedOrder.order_date,
                    shipping_city: savedOrder.shipping_city,
                    shipping_district: savedOrder.shipping_district,
                    product_image: order.items[0]?.product_image,
                });
            } catch (error) {
                // Silently fail - don't block payment status update
            }
        }

        return savedOrder;
    }

    // Hủy đơn hàng
    async cancelOrder(orderId: number, userId: number, reason?: string)
     {
        const order = await this.orderRepository.findOne({
            where: { id: orderId, user_id: userId },
        });

        if (!order) 
            {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
            throw new BadRequestException('Không thể hủy đơn hàng ở trạng thái này');
        }

        order.status = OrderStatus.CANCELLED;
        order.cancelled_at = new Date();
        
        if (reason) {
            order.notes = (order.notes || '') + `\nLý do hủy: ${reason}`;
        }

        return await this.orderRepository.save(order);
    }

    // Tìm đơn hàng theo order_number (cho payment)
    async findByOrderNumber(orderNumber: string) {
        return await this.orderRepository.findOne({
            where: { order_number: orderNumber },
            relations: ['items'],
        });
    }

    // ===== ADMIN METHODS =====

    // Admin: Lấy chi tiết đơn hàng
    async getAdminOrderById(orderId: number): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['items', 'items.product', 'items.variant'],
        });

        if (!order) {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        return order;
    }

    // Admin: Cập nhật trạng thái đơn hàng
    async updateOrderStatus(orderId: number, status: OrderStatus): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        // Validate status transitions
        if (order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Không thể thay đổi trạng thái đơn đã hủy');
        }

        if (order.status === OrderStatus.DELIVERED && status !== OrderStatus.DELIVERED) {
            throw new BadRequestException('Không thể thay đổi trạng thái đơn đã giao');
        }

        order.status = status;

        // Update timestamps
        switch (status) {
            case OrderStatus.CONFIRMED:
                if (!order.confirmed_at) order.confirmed_at = new Date();
                break;
            case OrderStatus.PROCESSING:
                if (!order.processing_at) order.processing_at = new Date();
                break;
            case OrderStatus.SHIPPED:
                if (!order.shipped_at) order.shipped_at = new Date();
                break;
            case OrderStatus.DELIVERED:
                if (!order.delivered_at) order.delivered_at = new Date();
                break;
            case OrderStatus.CANCELLED:
                if (!order.cancelled_at) order.cancelled_at = new Date();
                break;
        }

        return await this.orderRepository.save(order);
    }

    // Admin: Cập nhật thông tin vận chuyển
    async updateShippingInfo(
        orderId: number,
        shippingInfo: {
            tracking_number?: string;
            shipping_carrier?: string;
            shipped_at?: Date;
        }
    ): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        if (shippingInfo.tracking_number) {
            order.tracking_number = shippingInfo.tracking_number;
        }

        if (shippingInfo.shipping_carrier) {
            order.shipping_carrier = shippingInfo.shipping_carrier;
        }

        if (shippingInfo.shipped_at) {
            order.shipped_at = shippingInfo.shipped_at;
            if (order.status === OrderStatus.PROCESSING || order.status === OrderStatus.CONFIRMED) {
                order.status = OrderStatus.SHIPPED;
            }
        }

        return await this.orderRepository.save(order);
    }

    // Admin: Hủy đơn hàng
    async adminCancelOrder(orderId: number, reason?: string): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        if (order.status === OrderStatus.DELIVERED) {
            throw new BadRequestException('Không thể hủy đơn đã giao');
        }

        order.status = OrderStatus.CANCELLED;
        order.cancelled_at = new Date();

        if (reason) {
            order.notes = (order.notes || '') + `\n[Admin hủy] ${reason}`;
        }

        return await this.orderRepository.save(order);
    }

    // Admin: Xóa đơn hàng (soft delete)
    async deleteOrder(orderId: number): Promise<{ message: string }> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        await this.orderRepository.remove(order);

        return { message: `Đã xóa đơn hàng ${order.order_number}` };
    }

    // Admin: Thống kê đơn hàng
    async getOrderStats(): Promise<any> {
        const [
            totalOrders,
            pendingOrders,
            confirmedOrders,
            processingOrders,
            shippedOrders,
            deliveredOrders,
            cancelledOrders,
            paidOrders,
        ] = await Promise.all([
            this.orderRepository.count(),
            this.orderRepository.count({ where: { status: OrderStatus.PENDING } }),
            this.orderRepository.count({ where: { status: OrderStatus.CONFIRMED } }),
            this.orderRepository.count({ where: { status: OrderStatus.PROCESSING } }),
            this.orderRepository.count({ where: { status: OrderStatus.SHIPPED } }),
            this.orderRepository.count({ where: { status: OrderStatus.DELIVERED } }),
            this.orderRepository.count({ where: { status: OrderStatus.CANCELLED } }),
            this.orderRepository.count({ where: { payment_status: PaymentStatus.PAID } }),
        ]);

        // Calculate total revenue from paid orders
        const revenueResult = await this.orderRepository
            .createQueryBuilder('order')
            .select('SUM(order.total)', 'total')
            .where('order.payment_status = :status', { status: PaymentStatus.PAID })
            .getRawOne();

        return {
            totalOrders,
            byStatus: {
                pending: pendingOrders,
                confirmed: confirmedOrders,
                processing: processingOrders,
                shipped: shippedOrders,
                delivered: deliveredOrders,
                cancelled: cancelledOrders,
            },
            paidOrders,
            totalRevenue: parseFloat(revenueResult?.total || 0),
        };
    }

}
