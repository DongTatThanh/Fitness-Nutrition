import { Controller, Get, Param, Query, Put, Delete, Body, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';


@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(':id')
  getOne(@Param('id') id: number) { 
    return this.usersService.findProfileById(id);
  }

  // API Admin: Lấy danh sách khách hàng phân trang
  @Get('admin/list/all')
  async getAdminUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('sort') sort: string = 'created_at'
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    let query = this.usersService['usersRepo']
      .createQueryBuilder('user')
      .select([
        'user.user_id',
        'user.username',
        'user.email',
        'user.phone',
        'user.full_name',
        'user.address',
        'user.role_id',
        'user.customer_tier_id',
        'user.created_at'
      ])
      .skip(skip)
      .take(Number(limit));

    if (search) {
      query = query.where('user.username LIKE :search OR user.email LIKE :search OR user.phone LIKE :search', {
        search: `%${search}%`
      });
    }

    // Sort options: created_at, username, email
    const validSortFields = ['created_at', 'username', 'email'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    query = query.orderBy(`user.${sortField}`, 'DESC');

    const [users, total] = await query.getManyAndCount();

    return {
      data: users,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit))
    };
  }

  // API Admin: Xem chi tiết user
  @Get('admin/:id')
  async getAdminUserDetail(@Param('id') id: string) {
    const user = await this.usersService['usersRepo']
      .createQueryBuilder('user')
      .select([
        'user.user_id',
        'user.username',
        'user.email',
        'user.phone',
        'user.full_name',
        'user.address',
        'user.role_id',
        'user.customer_tier_id',
        'user.created_at'
      ])
      .where('user.user_id = :id', { id: Number(id) })
      .getOne();
       
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  // API Admin: Cập nhật thông tin user
  @Put('admin/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: Partial<{ username: string; email: string; phone: string; full_name: string; address: string; role_id: number }>
  ) {
    try {
      await this.usersService.updateUser(Number(id), updateData);
      
      // Lấy lại user nhưng không có password
      const user = await this.usersService['usersRepo']
        .createQueryBuilder('user')
        .select([
          'user.user_id',
          'user.username',
          'user.email',
          'user.phone',
          'user.full_name',
          'user.address',
          'user.role_id',
          'user.customer_tier_id',
          'user.created_at'
        ])
        .where('user.user_id = :id', { id: Number(id) })
        .getOne();

      return {
        success: true,
        message: 'Cập nhật thông tin người dùng thành công',
        data: user
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Không thể cập nhật người dùng');
    }
  }

  // API Admin: Xóa user
  @Delete('admin/:id')
  async deleteUser(@Param('id') id: string) {
    try {
      await this.usersService.deleteUser(Number(id));
      return {
        success: true,
        message: 'Xóa người dùng thành công'
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Không thể xóa người dùng');
    }
  }
}
