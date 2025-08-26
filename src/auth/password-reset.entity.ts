import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'password_resets' })
export class PasswordReset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  token: string;

  @Column({ type: 'datetime' })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
