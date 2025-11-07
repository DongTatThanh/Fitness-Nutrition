import { Cart } from './cart.entity';
import { Controller, Delete } from "@nestjs/common";
import { CartService } from "./cart.service";
import { Get, Param, ParseIntPipe } from "@nestjs/common";
import { AddToCartDto } from './DTO/cart.dto.entity';
import { Post, Body, Request } from "@nestjs/common";  
import { CartItem } from './cart_Item.entity';



@Controller('cart')
export class CartController {
    constructor(private cartService: CartService) 
    {}  
    // Lấy giỏ hàng theo ID người dùng

    

    @Post('items')
    async addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
        const userId = req.user?.id || 1; 
        return this.cartService.checkProductExists(userId, addToCartDto);
    }

    
    @Get()
    async getCartItems(@Request() req) {
        const userId = req.user?.id || 1; 
        return this.cartService.getCartItemsByUserId(userId);
    }

    // xóa item sản phẩm 
    @Delete('items/:id')
     
    async  removeFromCart 
    (
        @Request() req,
        @Param('id', ParseIntPipe) cartItemId: number
    )
    {
        const userId = req.user?.id || 1;
        return this.cartService.removeItemFromCart(userId, cartItemId);

    }
    // cập nhật số lượng sản phẩm 
    @Post('items/:id')
    async updateCartItemQuantity
    (
        @Request() req,
        @Param('id', ParseIntPipe) cartItemId: number,
        @Body('quantity') quantity: number
    ) {
        const userId = req.user?.id || 1;
        return this.cartService.updateCartItemQuantity(userId, cartItemId, quantity);

}
}