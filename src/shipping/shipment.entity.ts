import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Order } from '../orders/order.entity';
import { ShippingCarrier } from './shipping-carrier.entity';
import { ShipmentTracking } from './shipment-tracking.entity';

export enum ShipmentStatus {
  PENDING = 'pending',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned',
}

@Entity({ name: 'shipments' })
export class Shipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  order_id: number;

  @Column({ type: 'int' })
  carrier_id: number;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  tracking_number: string;

  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.PENDING,
  })
  status: ShipmentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  shipping_fee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number | null; // Trọng lượng (kg)

  @Column({ type: 'json', nullable: true })
  dimensions: { length: number; width: number; height: number } | null;

  @Column({ type: 'text', nullable: true })
  pickup_address: string | null;

  @Column({ type: 'text', nullable: false })
  delivery_address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  delivery_city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  delivery_district: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  delivery_ward: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  delivery_postal_code: string | null;

  @Column({ type: 'varchar', length: 100, nullable: false })
  recipient_name: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  recipient_phone: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamp', nullable: true })
  picked_up_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  in_transit_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  out_for_delivery_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  failed_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  returned_at: Date | null;

  @Column({ type: 'int', nullable: true })
  created_by: number | null; // Admin ID

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => ShippingCarrier)
  @JoinColumn({ name: 'carrier_id' })
  carrier: ShippingCarrier;

  @OneToMany(() => ShipmentTracking, (tracking) => tracking.shipment, {
    cascade: true,
  })
  tracking_history: ShipmentTracking[];
}

