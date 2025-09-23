import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepo: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepo: Repository<ProductVariant>
  ) {}

  async getCart(userId: number): Promise<Cart> {
    let cart = await this.cartRepo.findOne({
      where: { user_id: userId },
      relations: ['items', 'items.product', 'items.variant']
    });

    if (!cart) {
      cart = await this.createCart(userId);
    }

    return cart;
  }

  async addToCart(userId: number, addToCartDto: AddToCartDto): Promise<Cart> {
    const { product_id, variant_id, quantity } = addToCartDto;

    // Verify product exists
    const product = await this.productRepo.findOne({ where: { id: product_id, is_active: true } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Verify variant if provided
    let variant: ProductVariant | null = null;
    if (variant_id) {
      variant = await this.variantRepo.findOne({ where: { id: variant_id, product_id, is_active: true } });
      if (!variant) {
        throw new NotFoundException('Product variant not found');
      }
    }

    let cart = await this.getCart(userId);

    // Check if item already exists in cart
    const whereCondition: any = {
      cart_id: cart.id,
      product_id
    };
    
    if (variant_id) {
      whereCondition.variant_id = variant_id;
    } else {
      whereCondition.variant_id = null;
    }

    const existingItem = await this.cartItemRepo.findOne({
      where: whereCondition
    });

    const unitPrice = variant ? Number(product.price) + Number(variant.price_adjustment || 0) : Number(product.price);

    if (existingItem) {
      // Update quantity
      existingItem.quantity += quantity;
      existingItem.total_price = existingItem.quantity * unitPrice;
      await this.cartItemRepo.save(existingItem);
    } else {
      // Create new cart item
      const cartItemData: any = {
        cart_id: cart.id,
        product_id,
        quantity,
        unit_price: unitPrice,
        total_price: quantity * unitPrice
      };
      
      if (variant_id) {
        cartItemData.variant_id = variant_id;
      }
      
      const cartItem = this.cartItemRepo.create(cartItemData);
      await this.cartItemRepo.save(cartItem);
    }

    await this.updateCartTotals(cart.id);
    return this.getCart(userId);
  }

  async updateCartItem(userId: number, itemId: number, updateDto: UpdateCartItemDto): Promise<Cart> {
    const cart = await this.getCart(userId);
    
    const cartItem = await this.cartItemRepo.findOne({
      where: { id: itemId, cart_id: cart.id }
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    cartItem.quantity = updateDto.quantity;
    cartItem.total_price = cartItem.quantity * cartItem.unit_price;
    await this.cartItemRepo.save(cartItem);

    await this.updateCartTotals(cart.id);
    return this.getCart(userId);
  }

  async removeCartItem(userId: number, itemId: number): Promise<Cart> {
    const cart = await this.getCart(userId);
    
    const cartItem = await this.cartItemRepo.findOne({
      where: { id: itemId, cart_id: cart.id }
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepo.remove(cartItem);
    await this.updateCartTotals(cart.id);
    return this.getCart(userId);
  }

  async clearCart(userId: number): Promise<{ message: string }> {
    const cart = await this.getCart(userId);
    await this.cartItemRepo.delete({ cart_id: cart.id });
    await this.updateCartTotals(cart.id);
    return { message: 'Cart cleared successfully' };
  }

  private async createCart(userId: number): Promise<Cart> {
    const cart = this.cartRepo.create({
      user_id: userId,
      total_amount: 0,
      total_items: 0
    });
    return this.cartRepo.save(cart);
  }

  private async updateCartTotals(cartId: number): Promise<void> {
    const items = await this.cartItemRepo.find({ where: { cart_id: cartId } });
    
    const totalAmount = items.reduce((sum, item) => sum + Number(item.total_price), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    await this.cartRepo.update(cartId, {
      total_amount: totalAmount,
      total_items: totalItems
    });
  }
}