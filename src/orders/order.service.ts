import { DiscountCode } from './../entities/discount_code.entity';
import { Cart } from './../cart/cart.entity';
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order } from "./order.entity";
import { Repository } from "typeorm";
import { OrderItem } from "./orderItem.entity";
import { CartService } from "src/cart/cart.service";
import { CartItem } from 'src/cart/cart_Item.entity';



@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemRepository: Repository<OrderItem>,
        private CartService: CartService
    ) {}

    // tạo mã đơn hàng
    private createOrderNumber(): string
    {    
        const timestamp = Date.now().toString();
        const  random  = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return 'FN' + timestamp + random;
    }

     // Tính toán tống tiền đơn hàng 

     private async totalOrderAmount(cartId: number = 0 , discountAmount: number = 0, shippingFee: number = 0): number {
        const subtotal = CartItem.reduce((total, item) => total + item.price * item.quantity, 0);
        let total = 0;

        const tax_amount =0 // không có thuế sẽ hiển thị bằng =0 
        total = subtotal + shippingFee + tax_amount - discountAmount;
    
        return Math.max(total, 0); // tiền không âm 

    }
}
