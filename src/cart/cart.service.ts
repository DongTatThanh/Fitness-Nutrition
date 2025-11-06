import { User } from './../users/user.entity';
import { Cart } from './cart.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CartItem } from './cart_Item.entity';
import { Product } from '../products/product.entity';
import { AddToCartDto } from './DTO/cart.dto.entity';



    


@Injectable()
export class CartService {
    constructor(  @InjectRepository(Cart)
        private cartRepository: Repository<Cart>,
        @InjectRepository(CartItem)
        private cartItemRepository: Repository<CartItem>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
    ) {}

    // lấy giỏ hàng theo ID người dùng
    async getCartItemsByUserId(userId: number) {
      
        const cart = await this.cartRepository.find({
            where: { user_id: userId } ,
            relations: ['items', 'items.product', 'items.product.brand'],
        });

        if (!cart) {
            throw new NotFoundException(`Giỏ hàng của user_id ${userId} không tồn tại`);
        }

        return cart;
    }

     // Thêm sản phẩm vào giỏ hàng

        async checkProductExists(user_id: number, AddToCartDto: AddToCartDto)
         {


            // kiểm tra sản phẩm đã có trong giỏ hàng hay chưa 
          const product = await this.productRepository.findOne({
            where: { id: AddToCartDto.product_id, status: 'active' }
          });
            if (!product) {
                throw new NotFoundException(`Sản phẩm với ID ${AddToCartDto.product_id} không tồn tại hoặc không hoạt động.`);
            }
     //  kiểm tra tồn kho 
            // if (product.stock_quantity < AddToCartDto.quantity) {
            //     throw new NotFoundException(`Sản phẩm với ID ${AddToCartDto.product_id} không đủ số lượng trong kho.`);
            // }

            return product;

}   
}