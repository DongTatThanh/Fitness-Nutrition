import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Order } from "../orders/order.entity";

export enum PaymentMethod {
    COD = 'cod',
    BANK_TRANSFER = 'bank_transfer',
    CREDIT_CARD = 'credit_card',
    E_WALLET = 'e_wallet',
    
}

export enum PaymentStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded'
}

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    order_id: number;

    @ManyToOne(() => Order)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({
        type: 'enum',
        enum: PaymentMethod,
        default: PaymentMethod.BANK_TRANSFER
    })
    payment_method: PaymentMethod;

    @Column('decimal', { precision: 12, scale: 2 })
    amount: number;

    @Column({ length: 3, default: 'VND' })
    currency: string;

    @Column({ length: 255, nullable: true })
    transaction_id: string;

    @Column({ type: 'json', nullable: true })
    gateway_response: any;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING
    })
    status: PaymentStatus;

    @CreateDateColumn()
    payment_date: Date;

    @Column({ type: 'timestamp', nullable: true })
    completed_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    failed_at: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;
}