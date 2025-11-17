import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { FlashSale } from './flash-sale.entity';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';

@Entity('flash_sale_items')
export class FlashSaleProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  flash_sale_id: number;

  @Column()
  product_id: number;

  @Column({ nullable: true })
  variant_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  original_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  sale_price: number;

  @Column({ type: 'int', nullable: true })
  max_quantity: number;

  @Column({ type: 'int', default: 0 })
  sold_quantity: number;

  @ManyToOne(() => FlashSale, flashSale => flashSale.items)
  @JoinColumn({ name: 'flash_sale_id' })
  flashSale: FlashSale;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => ProductVariant, { nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;
}