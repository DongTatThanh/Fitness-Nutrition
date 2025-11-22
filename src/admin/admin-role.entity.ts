import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'admin_roles' })
export class AdminRole {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'role_name', length: 100, nullable: false, unique: true })
  role_name: string;

  @Column({ type: 'json', nullable: true })
  permissions: any;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  is_active: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

