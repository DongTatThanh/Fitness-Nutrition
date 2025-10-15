import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Brand } from '../brands/brand.entity';
import { Category } from '../categories/category.entity';
import { ProductVariant } from '../entities/product-variant.entity';

@Entity({ name: 'products' })
export class Product {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 220 })
  slug: string;

  @Column({ length: 100 })
  sku: string;

  @Column()
  brand_id: number;

  @Column()
  category_id: number;

  @Column({ length: 500 })
  short_description: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  ingredients: string;

  @Column({ type: 'text', nullable: true })
  usage_instructions: string;

  @Column({ type: 'text', nullable: true })
  warnings: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  compare_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost_price: number;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  track_inventory: boolean;

  // ⚙️ Sửa đúng cột gây lỗi ở đây
  @Column({ name: 'inventory_quantity', type: 'int', default: 0 })
  inventoryQuantity: number;

  @Column({ type: 'int', nullable: true })
  low_stock_threshold: number;

  @Column({ type: 'date', nullable: true })
  expiry_date: Date;

  @Column({ length: 50, nullable: true })
  batch_number: string;

  @Column({ length: 50, nullable: true })
  origin_country: string;

  @Column({ length: 100, nullable: true })
  manufacturer: string;

  @Column({ length: 255, nullable: true })
  featured_image: string;

  @Column({ type: 'json', nullable: true })
  image_gallery: any;

  @Column({ length: 255, nullable: true })
  meta_title: string;

  @Column({ type: 'text', nullable: true })
  meta_description: string;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  is_featured: boolean;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  is_new_arrival: boolean;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  is_bestseller: boolean;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  is_on_sale: boolean;

  @Column({ type: 'enum', enum: ['draft', 'active', 'inactive', 'out_of_stock'], default: 'draft' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  published_at: Date;

  @Column({ type: 'int', nullable: true })
  created_by: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Brand, (brand) => brand.products)
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];
}