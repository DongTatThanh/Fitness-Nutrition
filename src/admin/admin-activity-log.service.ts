import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminActivityLog } from './admin-activity-log.entity';

@Injectable()
export class AdminActivityLogService {
  constructor(
    @InjectRepository(AdminActivityLog)
    private readonly activityLogRepository: Repository<AdminActivityLog>,
  ) {}

  async createLog(
    adminId: number,
    action: string,
    description?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AdminActivityLog> {
    const log = this.activityLogRepository.create({
     
      action,
      description,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return this.activityLogRepository.save(log);
  }

  async getLogsByAdmin(adminId: number, limit: number = 50) {
    return this.activityLogRepository.find({
 
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getAllLogs(limit: number = 100) {
    return this.activityLogRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['admin'],
    });
  }

  // Method tương thích với SuperAdminManagementService
  async logActivity(data: {
    user_id?: number;
    action: string;
    entity_type?: string;
    entity_id?: number;
    details?: any;
    ip_address?: string;
    user_agent?: string;
  }): Promise<AdminActivityLog> {
    const description = data.details 
      ? JSON.stringify(data.details) 
      : `${data.action} on ${data.entity_type || 'unknown'}`;
    
    return this.createLog(
      data.user_id || 0,
      data.action,
      description,
      data.ip_address,
      data.user_agent,
    );
  }

  async getLogs(options?: {
    page?: number;
    limit?: number;
    user_id?: number;
    action?: string;
    entity_type?: string;
  }) {
    const limit = options?.limit || 100;
    const page = options?.page || 1;
    const skip = (page - 1) * limit;

    const query = this.activityLogRepository.createQueryBuilder('log')
      .leftJoinAndSelect('log.admin', 'admin')
      .orderBy('log.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (options?.user_id) {
      query.andWhere('log.adminId = :userId', { userId: options.user_id });
    }

    if (options?.action) {
      query.andWhere('log.action = :action', { action: options.action });
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLogById(logId: number): Promise<AdminActivityLog | null> {
    return this.activityLogRepository.findOne({
      where: { id: logId },
      relations: ['admin'],
    });
  }
}

