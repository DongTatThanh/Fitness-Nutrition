import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
    // Map DB column `id` to property `user_id` so existing code keeps using user.user_id
    @PrimaryGeneratedColumn({ name: 'id' })
    user_id: number;
  
    @Column({ length: 50, nullable: false, unique: true })
    username: string;
  
    @Column({ length: 100, nullable: false, unique: true })
    email: string;
  
    @Column({ length: 20, nullable: true })
    phone: string;
  
    // DB column is `password` — map to TS property `password_hash` so code doesn't need changes
    @Column({ name: 'password', length: 255 })
    password_hash: string;
  
    @Column({ length: 100, nullable: true })
    full_name: string;
  
    @Column({ type: 'text', nullable: true })
    address: string;
  
    @Column({ type: 'int', nullable: true })
    role_id: number | null;
  
    @Column({ type: 'int', nullable: true })
    customer_tier_id: number | null;
  
    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;
}
