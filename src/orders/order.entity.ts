import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { OrderItem } from './orderItem.entity';
import { OrderStatus } from './enum/order-status.enum';
import { PaymentStatus } from './enum/payment-status.enum';





@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50, unique: true })
    order_number: string;

    @Column()
    user_id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ length: 100 })
    customer_name: string;

    @Column({ length: 100 })
    customer_email: string;

    @Column({ length: 20 })
    customer_phone: string;

    @Column({ type: 'text' })
    shipping_address: string;

    @Column({ length: 100, nullable: true })
    shipping_city: string;

    @Column({ length: 100, nullable: true })
    shipping_district: string;

    @Column({ length: 100, nullable: true })
    shipping_ward: string;

    @Column({ length: 20, nullable: true })
    shipping_postal_code: string;

    @Column('decimal', { precision: 12, scale: 2 })
    subtotal: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    shipping_fee: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    tax_amount: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    discount_amount: number;

    @Column('decimal', { precision: 12, scale: 2 })
    total_amount: number;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING
    })
    status: OrderStatus;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING
    })
    payment_status: PaymentStatus;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'text', nullable: true })
    admin_notes: string;

    @Column({ length: 50, nullable: true })
    discount_code: string;

    @Column({ nullable: true })
    handled_by: number;

    @CreateDateColumn()
    order_date: Date;

    @Column({ type: 'timestamp', nullable: true })
    confirmed_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    shipped_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    delivered_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    cancelled_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => OrderItem, orderItem => orderItem.order, { cascade: true })
    items: OrderItem[];
}