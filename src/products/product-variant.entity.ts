import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity({ name: 'product_variants' })
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  product_id: number;

  @Column({ length: 100, nullable: true })
  sku: string;

  @Column({ length: 100, nullable: true })
  variant_name: string;

  @Column({ length: 50, nullable: true })
  size: string;

  @Column({ length: 50, nullable: true })
  flavor: string;

  @Column({ length: 50, nullable: true })
  color: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  compare_price: number;

  @Column({ type: 'int', default: 0 })
  inventory_quantity: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  weight: number;

  @Column({ length: 10, nullable: true })
  weight_unit: string;

  @Column({ length: 255, nullable: true })
  image_url: string;

  @Column({ length: 100, nullable: true })
  barcode: string;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  is_default: boolean;

  @Column({ type: 'tinyint', width: 1, default: 1 })
  is_active: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}