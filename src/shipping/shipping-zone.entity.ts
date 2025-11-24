import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'shipping_zones' })
export class ShippingZone {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  code: string;

  @Column({ type: 'json', nullable: true })
  provinces: string[] | null; // Danh sách tỉnh/thành phố

  @Column({ type: 'json', nullable: true })
  districts: string[] | null; // Danh sách quận/huyện (optional)

  @Column({ type: 'tinyint', width: 1, default: 1 })
  is_active: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

