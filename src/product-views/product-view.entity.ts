import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../entities/user.entity';
import { Product } from '../products/product.entity';

@Entity('product_views')
export class ProductView {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @Column()
    product_id: number;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    viewed_at: Date;

    @Column({ type: 'varchar', length: 50, nullable: true })
    ip_address: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    user_agent: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Product, { eager: true })
    @JoinColumn({ name: 'product_id' })
    product: Product;
}
