import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  user_id: number;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 255 })
  password_hash: string;

  @Column({ length: 255, nullable: true })
  google_id: string;

  @Column({ length: 255, nullable: true })
  facebook_id: string;

  @Column({ length: 100, nullable: true })
  full_name: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'enum', enum: ['user', 'trainer', 'admin'], default: 'user' })
  role: 'user' | 'trainer' | 'admin';
}
