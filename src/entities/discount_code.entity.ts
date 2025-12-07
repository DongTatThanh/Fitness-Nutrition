import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('discount_codes')
export class DiscountCode {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, length: 50 })
    code: string;

    @Column({ length: 100 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'enum', enum: ['percentage', 'fixed', 'free_shipping'] })
    type: string;

    @Column('decimal', { precision: 10, scale: 2 })
    value: number;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    minimum_order_amount: number;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    maximum_discount_amount: number;// giới hạn số tiền được giảm tối đa

    @Column({ nullable: true })
    usage_limit: number;// tổng số lần sử dụng mã

    @Column({ nullable: true })
    usage_limit_per_customer: number;// số lần sử dụng cho mỗi khách hàng

    @Column({ default: 0 })
    used_count: number;// số lần đã sử dụng

    @Column({ type: 'timestamp' })
    start_date: Date;

    @Column({ type: 'timestamp' })
    end_date: Date;

    @Column({ type: 'enum', enum: ['all', 'specific_products', 'specific_categories', 'specific_brands'] })
    applicable_to: string;

    @Column({ type: 'json', nullable: true })
    applicable_items: any;

    @Column({ type: 'tinyint', default: 1 })
    is_active: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true })
    image: string;

    @Column({ nullable: true })
    created_by: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}
