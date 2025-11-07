import { Cart } from './cart.entity';
import { Controller } from "@nestjs/common";
import { CartService } from "./cart.service";
import { Get, Param, ParseIntPipe } from "@nestjs/common";
import { AddToCartDto } from './DTO/cart.dto.entity';
import { Post, Body, Request } from "@nestjs/common";


@Controller('cart')
export class CartController {
    constructor(private cartService: CartService) 
    {}  
    // Lấy giỏ hàng theo ID người dùng

    

    @Post('items')
    async addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
        const userId = req.user?.id || 1; // Lấy ID người dùng từ request JWT (tạm dùng 1 để test)

        return this.cartService.checkProductExists(userId, addToCartDto);
    }
    @Get()
    async getCartItems(@Request() req) {
        const userId = req.user?.id || 1; // Lấy ID người dùng từ request JWT (tạm dùng 1 để test)
        return this.cartService.getCartItemsByUserId(userId);
    }
}