import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from 'src/users/user.entity';
import { Product } from 'src/products/product.entity';

@Entity('product_views')
export class ProductView {
  @PrimaryGeneratedColumn()
  id: number;


@ManyToOne(() => User, user => user.productViews, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' }) 
  user: User;


@ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @CreateDateColumn({ name: 'viewed_at' })
  viewedAt: Date;

  @Column({ name: 'ip_address', type: 'varchar', length: 50, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent: string;
}