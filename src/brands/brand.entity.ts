import { Product } from '../products/product.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity({ name: 'brands' })
export class Brand {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 220 })
  slug: string;

  @Column({ length: 255, nullable: true })
  logo_url: string;

  @Column({ length: 255, nullable: true })
  banner_url: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100, nullable: true })
  country: string;

  @Column({ length: 255, nullable: true })
  website: string;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  is_verified: boolean;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  is_featured: boolean;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({ type: 'tinyint', width: 1, default: 1 })
  is_active: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToMany(() => Product, (product) => product.brand)
  products: Product[];
}


