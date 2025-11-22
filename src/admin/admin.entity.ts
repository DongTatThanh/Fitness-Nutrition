import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'admins' })
export class Admin {
  @PrimaryGeneratedColumn({ name: 'id' })
  admin_id: number;

  @Column({ length: 100, nullable: false, unique: true })
  email: string;

  @Column({ name: 'password', length: 255 })
  @Exclude()
  password_hash: string;

  @Column({ length: 100, nullable: true })
  full_name: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 50, default: 'admin' })
  role: string;

  @Column({ type: 'tinyint', default: 1 })
  is_active: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

