import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Brand } from '../entities/brand.entity';
import { Category } from '../entities/category.entity';
import { ProductVariant } from '../entities/product-variant.entity';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'int', nullable: true })
  brand_id: number;

  @Column({ type: 'int', nullable: true })
  category_id: number;

  @Column({ type: 'int', default: 0 })
  stock_quantity: number;

  @Column({ length: 255, nullable: true })
  image_url: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @Column({ length: 50, nullable: true })
  sku: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Brand, brand => brand.products)
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @ManyToOne(() => Category, category => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => ProductVariant, variant => variant.product)
  variants: ProductVariant[];
}
