import { Cart } from './cart.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CartItem } from './cart_Item.entity';


    


@Injectable()
export class CartService {
    constructor(  @InjectRepository(Cart)
        private cartRepository: Repository<Cart>,
        @InjectRepository(CartItem)
        private cartItemRepository: Repository<CartItem>
    ) {}

    // lấy giỏ hàng theo ID người dùng
    async getCartItemsByUserId(userId: number) {
      
        const cart = await this.cartRepository.findOne({
            where: { user_id: userId } ,
            relations: ['items', 'items.product', 'items.product.brand'],
        });

        if (!cart) {
            throw new NotFoundException(`Giỏ hàng của user_id ${userId} không tồn tại`);
        }

        return cart;
    }

}   