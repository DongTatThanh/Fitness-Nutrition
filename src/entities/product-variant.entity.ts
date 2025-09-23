import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from '../products/product.entity';

@Entity({ name: 'product_variants' })
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  product_id: number;

  @Column({ length: 100, nullable: true })
  variant_name: string; // e.g., "Size", "Color", "Flavor"

  @Column({ length: 100 })
  variant_value: string; // e.g., "Large", "Red", "Vanilla"

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price_adjustment: number; // Additional price for this variant

  @Column({ type: 'int', default: 0 })
  stock_quantity: number;

  @Column({ length: 50, nullable: true })
  sku: string; // SKU specific to this variant

  @Column({ length: 255, nullable: true })
  image_url: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}