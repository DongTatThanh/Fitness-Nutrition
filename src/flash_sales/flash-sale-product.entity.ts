import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { FlashSale } from './flash-sale.entity';
import { Product } from '../products/product.entity';

@Entity('flash_sale_products')
export class FlashSaleProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  flash_sale_id: number;

  @Column()
  product_id: number;

  @Column({ type: 'int' })
  discount_percent: number; // % giảm

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discount_amount: number; // Số tiền giảm

  @Column({ type: 'int', nullable: true })
  quantity_limit: number; // Giới hạn

  @Column({ type: 'int', default: 0 })
  sold_count: number; // Đã bán

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => FlashSale, flashSale => flashSale.products)
  @JoinColumn({ name: 'flash_sale_id' })
  flashSale: FlashSale;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}