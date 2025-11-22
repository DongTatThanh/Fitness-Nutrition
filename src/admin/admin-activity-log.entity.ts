import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'admin_activity_logs' })
export class AdminActivityLog {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  user_id: number;

  @Column({ length: 100, nullable: false })
  action: string;

  @Column({ name: 'entity_type', length: 50, nullable: true })
  entity_type: string;

  @Column({ name: 'entity_id', type: 'int', nullable: true })
  entity_id: number;

  @Column({ type: 'json', nullable: true })
  details: any;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ip_address: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  user_agent: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}

