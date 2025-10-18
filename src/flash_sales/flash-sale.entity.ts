import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { FlashSaleProduct } from "./flash-sale-product.entity";

@Entity('flash_sales')
export class FlashSale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp' })
  start_time: Date;

  @Column({ type: 'timestamp' })
  end_time: Date;

  @Column({ type: 'tinyint', width: 1, default: 1 })
  is_active: boolean;

  @Column({ nullable: true })
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => FlashSaleProduct, flashSaleProduct => flashSaleProduct.flashSale)
  items: FlashSaleProduct[];
}
