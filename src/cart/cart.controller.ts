import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
@UseGuards(AuthGuard('jwt'))
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  getCart(@Req() req: any) {
    return this.cartService.getCart(req.user.user_id);
  }

  @Post('items')
  addToCart(@Req() req: any, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(req.user.user_id, addToCartDto);
  }

  @Put('items/:id')
  updateCartItem(
    @Req() req: any,
    @Param('id', ParseIntPipe) itemId: number,
    @Body() updateDto: UpdateCartItemDto
  ) {
    return this.cartService.updateCartItem(req.user.user_id, itemId, updateDto);
  }

  @Delete('items/:id')
  removeCartItem(@Req() req: any, @Param('id', ParseIntPipe) itemId: number) {
    return this.cartService.removeCartItem(req.user.user_id, itemId);
  }

  @Delete()
  clearCart(@Req() req: any) {
    return this.cartService.clearCart(req.user.user_id);
  }
}