import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity({ name: 'product_attributes' })
export class ProductAttribute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  product_id: number;

  @Column({ length: 100 })
  attribute_name: string; // e.g., "Protein", "Calories", "Serving Size"

  @Column({ length: 255 })
  attribute_value: string; // e.g., "24g", "120 kcal", "30g"

  @Column({ length: 20, nullable: true })
  unit: string; // e.g., "g", "ml", "kcal"

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @ManyToOne(() => Product, (product) => product.attributes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
