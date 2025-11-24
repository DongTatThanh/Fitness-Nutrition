import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';

export enum TransactionType {
  PURCHASE = 'purchase', // Nhập hàng
  SALE = 'sale', // Bán hàng
  ADJUSTMENT = 'adjustment', // Điều chỉnh
  RETURN = 'return', // Trả hàng
  DAMAGE = 'damage', // Hư hỏng
  TRANSFER = 'transfer', // Chuyển kho
}

export enum ReferenceType {
  PURCHASE_ORDER = 'purchase_order',
  ORDER = 'order',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
}

@Entity({ name: 'inventory_transactions' })
export class InventoryTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  product_id: number;

  @Column({ type: 'int', nullable: true })
  variant_id: number | null;

  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.PURCHASE,
  })
  transaction_type: TransactionType;

  @Column({ type: 'int' })
  quantity: number; // Số lượng (dương = nhập, âm = xuất)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unit_cost: number | null; // Giá nhập/đơn vị

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total_cost: number | null; // Tổng giá trị

  @Column({ type: 'varchar', length: 50, nullable: true })
  reference_type: ReferenceType | null; // Loại tham chiếu

  @Column({ type: 'int', nullable: true })
  reference_id: number | null; // ID của đơn hàng/đơn nhập

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'int', nullable: true })
  created_by: number | null; // Admin ID

  @Column({ type: 'int', nullable: true })
  balance_after: number | null; // Tồn kho sau giao dịch

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  // Relations
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => ProductVariant, { nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant | null;
}

