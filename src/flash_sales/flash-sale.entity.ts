
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { FlashSaleProduct } from "./flash-sale-product.entity"; 
    
 





@Entity('flash_sales')
export class FlashSale {
    @PrimaryGeneratedColumn()
    @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'datetime' })
  start_date: Date;

  @Column({ type: 'datetime' })
  end_date: Date;

  @Column({ type: 'tinyint', width: 1, default: 1 })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => FlashSaleProduct, flashSaleProduct => flashSaleProduct.flashSale)
  products: FlashSaleProduct[];
}
