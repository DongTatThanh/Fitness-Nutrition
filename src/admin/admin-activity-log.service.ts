import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminActivityLog } from './admin-activity-log.entity';

@Injectable()
export class AdminActivityLogService {
  constructor(
    @InjectRepository(AdminActivityLog)
    private activityLogRepo: Repository<AdminActivityLog>,
  ) {}

  /**
   * Ghi log hoạt động của admin
   */
  async logActivity(data: {
    user_id?: number;
    action: string;
    entity_type?: string;
    entity_id?: number;
    details?: any;
    ip_address?: string;
    user_agent?: string;
  }) {
    const log = this.activityLogRepo.create(data);
    return this.activityLogRepo.save(log);
  }

  /**
   * Lấy danh sách logs (có phân trang)
   */
  async getLogs(options?: {
    page?: number;
    limit?: number;
    user_id?: number;
    action?: string;
    entity_type?: string;
  }) {
    try {
      const {
        page = 1,
        limit = 50,
        user_id,
        action,
        entity_type,
      } = options || {};

      // Validate page và limit
      const validPage = page > 0 ? page : 1;
      const validLimit = limit > 0 && limit <= 100 ? limit : 50;

      const query = this.activityLogRepo
        .createQueryBuilder('log')
        .orderBy('log.created_at', 'DESC')
        .skip((validPage - 1) * validLimit)
        .take(validLimit);

      if (user_id && user_id > 0) {
        query.andWhere('log.user_id = :user_id', { user_id });
      }

      if (action && action.trim()) {
        query.andWhere('log.action LIKE :action', { action: `%${action.trim()}%` });
      }

      if (entity_type && entity_type.trim()) {
        query.andWhere('log.entity_type = :entity_type', { entity_type: entity_type.trim() });
      }

      const [logs, total] = await query.getManyAndCount();

      return {
        data: logs || [],
        total: total || 0,
        page: validPage,
        limit: validLimit,
        lastPage: Math.ceil((total || 0) / validLimit),
      };
    } catch (error) {
      // Trả về empty result thay vì throw error
      return {
        data: [],
        total: 0,
        page: options?.page || 1,
        limit: options?.limit || 50,
        lastPage: 0,
      };
    }
  }

  /**
   * Lấy log theo ID
   */
  async getLogById(id: number) {
    return this.activityLogRepo.findOne({ where: { id } });
  }
}

