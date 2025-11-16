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




@Injectable()
export class OrderService
 {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemRepository: Repository<OrderItem>,
        private cartService: CartService,
        private discountCodeService: DiscountCodeService
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
