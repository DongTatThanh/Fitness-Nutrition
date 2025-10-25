import { Cart } from './cart.entity';
import { Controller } from "@nestjs/common";
import { CartService } from "./cart.service";
import { Get, Param, ParseIntPipe } from "@nestjs/common";


@Controller('cart')
export class CartController {
    constructor(private cartService: CartService) 
    {}  
    // Lấy giỏ hàng theo ID người dùng

    @Get('user/:userId')
    async getCartItemsByUserId(@Param('userId', ParseIntPipe) userId: number) {
        return this.cartService.getCartItemsByUserId(userId);
    }

}