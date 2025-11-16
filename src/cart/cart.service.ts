

import { User } from './../users/user.entity';
import { Cart } from './cart.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CartItem } from './cart_Item.entity';
import { Product } from '../products/product.entity';
import { AddToCartDto } from './DTO/cart.dto.entity';
import { ProductVariant } from 'src/products/product-variant.entity';



    


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
        const cart = await this.cartRepository.findOne({
            where: { user_id: userId },
            relations: ['items', 'items.product', 'items.product.brand'],
        });

        if (!cart) {
            return { 
                success: true,
                message: 'Giỏ hàng trống',
                data: { items: [], total: 0, itemCount: 0 } 
            };
        }

        const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const itemCount = cart.items.reduce((count, item) => count + item.quantity, 0);

        return {
            success: true,
            message: 'Lấy giỏ hàng thành công',
            data: {
                items: cart.items,
                total,
                itemCount
            }
        };
    }

     // Thêm sản phẩm vào giỏ hàng

        async checkProductExists(user_id: number, AddToCartDto: AddToCartDto) {
            // kiểm tra sản phẩm đã có trong giỏ hàng hay chưa 
            const product = await this.productRepository.findOne({
                where: { id: AddToCartDto.product_id, status: 'active' }
            });
            if (!product) {
                throw new NotFoundException(`Sản phẩm với ID ${AddToCartDto.product_id} không tồn tại hoặc không hoạt động.`);
            }
     
            // kiểm tra tồn kho 
            if (product.inventory_quantity < AddToCartDto.quantity) {
                throw new NotFoundException(`Sản phẩm với ID ${AddToCartDto.product_id} không đủ số lượng trong kho.`);
            }

            // tìm nếu không có thì tạo mới giỏ hàng cho user
            let cart = await this.cartRepository.findOne({  
                where: { user_id: user_id },
                relations: ['items', 'items.product'],
            }); 
            
            if (!cart) {
                cart = this.cartRepository.create({ user_id: user_id });
                cart = await this.cartRepository.save(cart);
            }

            // kiểm tra sản phẩm đã có trong giỏ hàng chưa
            const existingItem = await this.cartItemRepository.findOne({
                where: {
                    cart_id: cart.id,
                    product: { id: AddToCartDto.product_id },
                },
            });

            if (existingItem) {
                // cập nhật số lượng nếu sản phẩm đã tồn tại trong giỏ hàng 
                existingItem.quantity += AddToCartDto.quantity;
                await this.cartItemRepository.save(existingItem);
            } else {
                // tạo mới nếu sản phẩm chưa có trong giỏ hàng 
                const cartItem = this.cartItemRepository.create({
                    cart_id: cart.id, 
                    product: product,
                    variant: AddToCartDto.variant ? { id: AddToCartDto.variant } as any : undefined,
                    quantity: AddToCartDto.quantity,
                    price: product.price,
                });
                await this.cartItemRepository.save(cartItem);
            }

            return this.getcart(user_id);
        }
        // tìm giỏ hàng theo user id
        async getcart(user_id: number) {
            const cart = await this.cartRepository.findOne({
                where: { user_id: user_id },
                relations: ['items', 'items.product', 'items.product.brand'],
            }); 
            
            if (!cart) {
                return {
                    success: true,
                    message: 'Giỏ hàng trống',
                    data: { items: [], total: 0, itemCount: 0 }
                };
            }

            // tính tổng tiền cho giỏ hàng  
            const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const itemCount = cart.items.reduce((count, item) => count + item.quantity, 0);
          
            return {
                success: true,
                message: 'Lấy giỏ hàng thành công',
                data: {
                    items: cart.items,
                    total,
                    itemCount
                }
            };
        }

    //  xóa sản phẩm khỏi giỏ hàng 
    async removeItemFromCart(user_id: number, CartItem_id: number) {
        const cartItem = await this.cartItemRepository.findOne({
            where: { id: CartItem_id, cart: { user_id: user_id } },
            relations: ['cart'],
        });
        
        if (!cartItem) {
            throw new NotFoundException(`Sản phẩm với ID ${CartItem_id} không tồn tại trong giỏ hàng.`);
        }

        // xóa cart item
        await this.cartItemRepository.remove(cartItem);
        return this.getcart(user_id); // trả về giỏ hàng mới nhất
    }

    // cập nhật lại số lượng sản phẩm trong giỏ hàng
    async updateCartItemQuantity(user_id: number, CartItem_id: number, quantity: number) {
        const cartItem = await this.cartItemRepository.findOne({
            where: { id: CartItem_id, cart: { user_id: user_id } },
            relations: ['cart', 'product'],
        });

        if (!cartItem) {
            throw new NotFoundException(`Sản phẩm với ID ${CartItem_id} không tồn tại trong giỏ hàng.`);
        }

        cartItem.quantity = quantity;
        await this.cartItemRepository.save(cartItem);

        return this.getcart(user_id);
    }
}
