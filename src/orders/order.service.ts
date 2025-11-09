import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order } from "./order.entity";
import { Repository } from "typeorm";
import { OrderItem } from "./orderItem.entity";
import { CartService } from "../cart/cart.service";

import { OrderStatus } from "./enum/order-status.enum";
import { PaymentStatus } from "./enum/payment-status.enum";
import { CreateOrderDto } from "./DTO/order.dto";


@Injectable()
export class OrderService
 {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemRepository: Repository<OrderItem>,
        private cartService: CartService
    ) {}

    // tạo mã đơn hàng
    private createOrderNumber(): string {    
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return 'FN' + timestamp + random;
    }

    // Tính toán tổng tiền đơn hàng 
    private calculateOrderTotal(cartItems: any[], shippingFee: number = 0, discountAmount: number = 0): number
     {
        const subtotal = cartItems.reduce((total, item) => {
            return total + (parseFloat(item.price) * item.quantity);
        }, 0);

        const tax_amount = 0; // không có thuế sẽ hiển thị bằng 0 
        const total = subtotal + shippingFee + tax_amount - discountAmount;
    
        return Math.max(total, 0); // tiền không âm 
    }

    // Tạo đơn hàng mới từ giỏ hàng
    async createOrder(userId: number, createOrderDto: CreateOrderDto) 
    {
        const cart = await this.cartService.getcart(userId);
         
        if (!cart || !cart.items || cart.items.length === 0) 
            {
            throw new BadRequestException('Giỏ hàng trống. Không thể tạo đơn hàng.');
        }

        // tạo mã đơn hàng
        const orderNumber = this.createOrderNumber();

        // Tính toán 
        const subtotal = cart.total;
        const shippingFee = createOrderDto.shipping_fee || 30000;
        const discountAmount = 0; // nếu không có mã giảm giá thì bằng 0 
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
            discount_code: createOrderDto.discount_code,
        });

        const savedOrder = await this.orderRepository.save(order);

        // tạo order items từ cart items
        const orderItems = cart.items.map(item => {
            const unitPrice = parseFloat(item.price);
            const quantity = item.quantity;
            const totalPrice = unitPrice * quantity;

            return this.orderItemRepository.create({
                order_id: savedOrder.id,
                product_id: item.product.id,
                variant_id: item.variant?.id || null,
                product_name: item.product.name,
                variant_name: item.variant?.name || null,
                sku: item.product.sku,
                quantity: quantity,
                unit_price: unitPrice,
                total_price: totalPrice,
                product_image: item.product.featured_image,
            });
        });

        await this.orderItemRepository.save(orderItems);

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
        });

        if (!order) {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        order.payment_status = paymentStatus;

        if (paymentStatus === PaymentStatus.PAID) {
            order.status = OrderStatus.CONFIRMED;
            order.confirmed_at = new Date();
        }

        return await this.orderRepository.save(order);
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
}
