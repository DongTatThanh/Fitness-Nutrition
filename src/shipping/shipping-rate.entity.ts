import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ShippingCarrier } from './shipping-carrier.entity';
import { ShippingZone } from './shipping-zone.entity';

@Entity({ name: 'shipping_rates' })
export class ShippingRate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  carrier_id: number;

  @Column({ type: 'int' })
  zone_id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  min_weight: number; // Trọng lượng tối thiểu (kg)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  max_weight: number | null; // Trọng lượng tối đa (kg)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  base_fee: number; // Phí cơ bản

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fee_per_kg: number; // Phí mỗi kg

  @Column({ type: 'int', nullable: true })
  estimated_days: number | null; // Số ngày ước tính

  @Column({ type: 'tinyint', width: 1, default: 1 })
  is_active: number;

  @Column({ type: 'int', default: 0 })
  priority: number; // Độ ưu tiên (số nhỏ hơn = ưu tiên cao hơn)

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => ShippingCarrier)
  @JoinColumn({ name: 'carrier_id' })
  carrier: ShippingCarrier;

  @ManyToOne(() => ShippingZone)
  @JoinColumn({ name: 'zone_id' })
  zone: ShippingZone;
}

