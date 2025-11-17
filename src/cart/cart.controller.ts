import { Cart } from './cart.entity';
import { Controller, Delete, UseGuards } from "@nestjs/common";
import { CartService } from "./cart.service";
import { Get, Param, ParseIntPipe } from "@nestjs/common";
import { AddToCartDto } from './DTO/cart.dto.entity';
import { UpdateCartItemDto } from './DTO/update-cart-item.dto';
import { Post, Body, Request } from "@nestjs/common";  
import { CartItem } from './cart_Item.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';



@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
    constructor(private cartService: CartService) 
    {}  
    // Lấy giỏ hàng theo ID người dùng

    

    @Post('items')
    async addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
        if (!req.user?.id) {
            return {
                success: false,
                message: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng',
                data: null
            };
        }
        return this.cartService.checkProductExists(req.user.id, addToCartDto);
    }

    
    @Get()
    async getCartItems(@Request() req) {
        if (!req.user?.id) {
            return {
                success: true,
                message: 'Giỏ hàng trống',
                data: { items: [], total: 0, itemCount: 0 }
            };
        }
        return this.cartService.getCartItemsByUserId(req.user.id);
    }

    // xóa item sản phẩm 
    @Delete('items/:id')
     
    async  removeFromCart 
    (
        @Request() req,
        @Param('id', ParseIntPipe) cartItemId: number
    )
    {
        if (!req.user?.id) {
            return {
                success: false,
                message: 'Vui lòng đăng nhập để xóa sản phẩm khỏi giỏ hàng',
                data: null
            };
        }
        return this.cartService.removeItemFromCart(req.user.id, cartItemId);

    }
    // cập nhật số lượng sản phẩm 
    @Post('items/:id')
    async updateCartItemQuantity
    (
        @Request() req,
        @Param('id', ParseIntPipe) cartItemId: number,
        @Body() updateDto: UpdateCartItemDto
    ) {
        if (!req.user?.id) {
            return {
                success: false,
                message: 'Vui lòng đăng nhập để cập nhật giỏ hàng',
                data: null
            };
        }
        // Chỉ lấy quantity, bỏ qua price (backend sẽ tính lại từ product)
        return this.cartService.updateCartItemQuantity(req.user.id, cartItemId, updateDto.quantity);

}
}