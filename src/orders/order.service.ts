import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order } from "./order.entity";
import { Repository, LessThan } from "typeorm";
import { OrderItem } from "./orderItem.entity";
import { CartService } from "../cart/cart.service";
import { DiscountCodeService } from "../discount_code/discount_code.service";
import { OrderStatus } from "./enum/order-status.enum";
import { PaymentStatus } from "./enum/payment-status.enum";
import { CreateOrderDto } from "./DTO/order.dto";
import { OrdersGateway } from "../WebSocket/gteway";
import { Product } from "../products/product.entity";
import { ProductVariant } from "../products/product-variant.entity";
import { Cron } from "@nestjs/schedule";




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

    /**
     * BƯỚC 1: Tạo đơn hàng với Transaction + Pessimistic Lock
    
     */
    async createOrder(userId: number, createOrderDto: CreateOrderDto) 
    {
        // SỬ DỤNG TRANSACTION để đảm bảo tất cả hoặc không có gì
        return await this.orderRepository.manager.transaction(async (transactionalEntityManager) => {
            const cartResponse = await this.cartService.getcart(userId);
            const cart = cartResponse.data || cartResponse;
             
            if (!cart || !cart.items || cart.items.length === 0) {
                throw new BadRequestException('Giỏ hàng trống. Không thể tạo đơn hàng.');
            }

            // ========== BƯỚC 1: KIỂM TRA VÀ RESERVE STOCK VỚI PESSIMISTIC LOCK ==========
            const productRepository = transactionalEntityManager.getRepository(Product);
            const variantRepository = transactionalEntityManager.getRepository(ProductVariant);
            
            // Duyệt qua từng item trong giỏ hàng để kiểm tra và reserve stock
            for (const item of cart.items) {
                const productId = item.product.id;
                const variantId = item.variant?.id;
                const requestedQuantity = item.quantity;

                // PESSIMISTIC WRITE LOCK - Chặn các transaction khác cho đến khi commit
                const product = await productRepository.findOne({
                    where: { id: productId },
                    lock: { mode: 'pessimistic_write' }
                });

                if (!product) {
                    throw new NotFoundException(`Sản phẩm ID ${productId} không tồn tại`);
                }

                // Xử lý sản phẩm có variant
                if (variantId) {
                    const variant = await variantRepository.findOne({
                        where: { id: variantId, product_id: productId },
                        lock: { mode: 'pessimistic_write' }
                    });

                    if (!variant) {
                        throw new NotFoundException(`Biến thể sản phẩm không tồn tại`);
                    }

                    if (product.track_inventory && variant.inventory_quantity < requestedQuantity) {
                        throw new BadRequestException(
                            `Sản phẩm "${product.name}" - "${variant.variant_name}" chỉ còn ${variant.inventory_quantity} sản phẩm. Bạn yêu cầu ${requestedQuantity} sản phẩm.`
                        );
                    }

                    // RESERVE STOCK: Giảm inventory_quantity ngay lập tức
                    if (product.track_inventory) {
                        variant.inventory_quantity -= requestedQuantity;
                        await variantRepository.save(variant);
                    }
                } else {
                    // Xử lý sản phẩm không có variant
                    if (product.track_inventory && product.inventory_quantity < requestedQuantity) {
                        throw new BadRequestException(
                            `Sản phẩm "${product.name}" chỉ còn ${product.inventory_quantity} sản phẩm. Bạn yêu cầu ${requestedQuantity} sản phẩm.`
                        );
                    }

                    // RESERVE STOCK: Giảm inventory_quantity ngay lập tức
                    if (product.track_inventory) {
                        product.inventory_quantity -= requestedQuantity;
                        
                        if (product.inventory_quantity <= 0) {
                            product.status = 'out_of_stock';
                        }
                        
                        await productRepository.save(product);
                    }
                }
            }

            // ========== BƯỚC 2: TẠO ĐƠN HÀNG (sau khi đã reserve stock thành công) ==========
            const orderNumber = this.createOrderNumber();

            // Tính toán 
            const subtotal = cart.total;
            const shippingFee = createOrderDto.shipping_fee || 0;
        
            // Xử lý mã giảm giá
            let discountAmount = 0;
            let discountCode: string | null = null;
            
            if (createOrderDto.discount_code) {
                try {
                    const validation = await this.discountCodeService.validateAndUseCode(
                        createOrderDto.discount_code
                    );

                    if (validation.valid && validation.discountValue) {
                        if (validation.discountType === 'percentage') {
                            discountAmount = (subtotal * validation.discountValue) / 100;
                        } else if (validation.discountType === 'fixed') {
                            discountAmount = validation.discountValue;
                        }
                        discountAmount = Math.min(discountAmount, subtotal);
                        discountCode = createOrderDto.discount_code;
                    }
                } catch (error) {
                    discountAmount = 0;
                    discountCode = null;
                }
            }
            const totalAmount = this.calculateOrderTotal(cart.items, shippingFee, discountAmount);

 
       

            // Tạo order mới trong transaction
            const order = transactionalEntityManager.create(Order, {
            order_number: orderNumber,
            user_id: userId,
            customer_name: createOrderDto.customer_name,
            customer_email: createOrderDto.customer_email,
            customer_phone: createOrderDto.customer_phone,
            shipping_address: createOrderDto.shipping_address,         shipping_city: createOrderDto.shipping_city,
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

            const savedOrder = await transactionalEntityManager.save(Order, order);

            // ========== BƯỚC 3: TẠO ORDER ITEMS ==========
            const orderItems = cart.items.map(item => {
                const unitPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
                const quantity = item.quantity;
                const totalPrice = unitPrice * quantity;

                return transactionalEntityManager.create(OrderItem, {
                    order_id: savedOrder.id,
                    product_id: item.product.id,
                    variant_id: item.variant?.id,
                    product_name: item.product.name,
                    variant_name: item.variant?.name,
                    sku: item.product.sku,
                    quantity: quantity,
                    unit_price: unitPrice,
                    total_price: totalPrice,
                    product_image: item.product.featured_image,
                });
            });

            await transactionalEntityManager.save(OrderItem, orderItems);

            // ========== BƯỚC 4: GỬI THÔNG BÁO QUA WEBSOCKET ==========
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

            // Transaction sẽ tự động commit ở đây nếu không có lỗi
            // Nếu có lỗi, tất cả thay đổi sẽ được rollback (bao gồm cả stock đã reserve)

            // Lấy lại order với relations sau khi đã save (trong cùng transaction)
            // Phải dùng transactionalEntityManager để query trong cùng transaction
            const orderWithItems = await transactionalEntityManager.findOne(Order, {
                where: { id: savedOrder.id, user_id: userId },
                relations: ['items']
            });

            if (!orderWithItems) {
                throw new NotFoundException('Không thể lấy thông tin đơn hàng sau khi tạo');
            }

            // Trả về order với items (không cần relation product vì đã có product_name trong OrderItem)
            return orderWithItems;
        });
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

    /**
     * BƯỚC 2: Cập nhật trạng thái thanh toán
     * - THÀNH CÔNG (PENDING → PAID): Stock đã reserve, giữ nguyên
     * - THẤT BẠI (PAID → FAILED/REFUNDED): Hoàn trả stock
     */
    async updatePaymentStatus(orderId: number, paymentStatus: PaymentStatus) 
    {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['items'],
        });

        if (!order) {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        const wasPending = order.payment_status === PaymentStatus.PENDING;
        const wasPaid = order.payment_status === PaymentStatus.PAID;
        const isNowPaid = paymentStatus === PaymentStatus.PAID;
        const isNowFailed = paymentStatus === PaymentStatus.FAILED;
        const isNowRefunded = paymentStatus === PaymentStatus.REFUNDED;

        // TRƯỜNG HỢP 1: Thanh toán THÀNH CÔNG (PENDING → PAID)
        // Stock đã được reserve khi tạo đơn, không cần làm gì thêm
        if (wasPending && isNowPaid) {
            order.status = OrderStatus.CONFIRMED;
            order.confirmed_at = new Date();
            
            // Gửi thông báo WebSocket
            try {
                const products = order.items.map(item => ({
                    name: item.product_name + (item.variant_name ? ` - ${item.variant_name}` : ''),
                    quantity: item.quantity,
                }));

                this.ordersGateway.sendNewOrder({
                    customer_name: order.customer_name,
                    products: products,
                    order_date: order.order_date,
                    shipping_city: order.shipping_city,
                    shipping_district: order.shipping_district,
                    product_image: order.items[0]?.product_image,
                });
            } catch (error) {
                // Silently fail
            }
        }

        // TRƯỜNG HỢP 2: Thanh toán THẤT BẠI hoặc REFUND (PAID → FAILED/REFUNDED)
        // Hoàn trả stock về kho
        if (wasPaid && (isNowFailed || isNowRefunded)) {
            await this.restoreInventory(order.items);
            order.status = OrderStatus.CANCELLED;
            order.cancelled_at = new Date();
        }

        order.payment_status = paymentStatus;
        return await this.orderRepository.save(order);
    }

    /**
     * Method: Hoàn trả stock khi thanh toán thất bại/hủy đơn
     */
    private async restoreInventory(orderItems: OrderItem[]) {
        const productRepository = this.orderRepository.manager.getRepository(Product);
        const variantRepository = this.orderRepository.manager.getRepository(ProductVariant);

        for (const item of orderItems) {
            const product = await productRepository.findOne({
                where: { id: item.product_id }
            });

            if (!product || !product.track_inventory) continue;

            if (item.variant_id) {
                // Hoàn trả stock variant
                await variantRepository.increment(
                    { id: item.variant_id },
                    'inventory_quantity',
                    item.quantity
                );
            } else {
                // Hoàn trả stock sản phẩm chính
                await productRepository.increment(
                    { id: item.product_id },
                    'inventory_quantity',
                    item.quantity
                );

                // Cập nhật status nếu có hàng lại
                const updatedProduct = await productRepository.findOne({
                    where: { id: item.product_id }
                });
                
                if (updatedProduct && updatedProduct.inventory_quantity > 0 && updatedProduct.status === 'out_of_stock') {
                    updatedProduct.status = 'active';
                    await productRepository.save(updatedProduct);
                }
            }
        }
    }

    /**
     * Hủy đơn hàng - Hoàn trả stock
     * Stock đã được reserve khi tạo đơn, cần hoàn trả khi hủy
     */
    async cancelOrder(orderId: number, userId: number, reason?: string)
     {
        const order = await this.orderRepository.findOne({
            where: { id: orderId, user_id: userId },
            relations: ['items'],
        });

        if (!order) {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
            throw new BadRequestException('Không thể hủy đơn hàng ở trạng thái này');
        }

        // HOÀN TRẢ STOCK (vì đã reserve khi tạo đơn)
        await this.restoreInventory(order.items);

        order.status = OrderStatus.CANCELLED;
        order.cancelled_at = new Date();
        
        // Nếu đã thanh toán, có thể set payment_status = REFUNDED
        if (order.payment_status === PaymentStatus.PAID) {
            order.payment_status = PaymentStatus.REFUNDED;
        }
        
        if (reason) {
            order.notes = (order.notes || '') + `\nLý do hủy: ${reason}`;
        }

        return await this.orderRepository.save(order);
    }

    /**
     * BƯỚC 3: Scheduled Job - Tự động hủy đơn chưa thanh toán sau 15 phút
     * Chạy mỗi 5 phút để kiểm tra và hủy các đơn quá hạn
     */
    @Cron('*/5 * * * *') // Chạy mỗi 5 phút
    async handlePaymentTimeout() {
        const timeoutMinutes = 15; // Timeout sau 15 phút
        const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);

        const expiredOrders = await this.orderRepository.find({
            where: {
                payment_status: PaymentStatus.PENDING,
                order_date: LessThan(timeoutDate),
                status: OrderStatus.PENDING,
            },
            relations: ['items'],
        });

        for (const order of expiredOrders) {
            try {
                // Hoàn trả stock vì đơn chưa thanh toán
                await this.restoreInventory(order.items);
                
                // Tự động hủy đơn
                order.status = OrderStatus.CANCELLED;
                order.cancelled_at = new Date();
                order.notes = (order.notes || '') + '\nTự động hủy: Quá thời gian thanh toán (15 phút)';
                
                await this.orderRepository.save(order);
            } catch (error) {
                // Silently fail - log error internally if needed
            }
        }
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

        // Tính tổng doanh thu từ đơn hàng đã thanh toán
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
