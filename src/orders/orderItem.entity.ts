import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';
@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    order_id: number;

    @ManyToOne(() => Order, order => order.items)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column()
    product_id: number;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ nullable: true })
    variant_id: number;

    @ManyToOne(() => ProductVariant, { nullable: true })
    @JoinColumn({ name: 'variant_id' })
    variant: ProductVariant;

    @Column({ length: 200 })
    product_name: string;

    @Column({ length: 100, nullable: true })
    variant_name: string;

    @Column({ length: 100, nullable: true })
    sku: string;

    @Column()
    quantity: number;

    @Column('decimal', { precision: 10, scale: 2 })
    unit_price: number;

    @Column('decimal', { precision: 10, scale: 2 })
    total_price: number;

    @Column({ length: 255, nullable: true })
    product_image: string;
}