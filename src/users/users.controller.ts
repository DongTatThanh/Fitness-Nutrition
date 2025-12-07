import { Controller, Get, Param, Query, Put, Delete, Body, NotFoundException, BadRequestException, Post, UseInterceptors, ParseIntPipe, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminResponseInterceptor } from '../admin/admin-response.interceptor';
import * as bcrypt from 'bcryptjs';


@Controller('users')
@UseInterceptors(AdminResponseInterceptor)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(':id')
  getOne(@Param('id') id: number) { 
    return this.usersService.findProfileById(id);
  }

  // API Admin: Lấy danh sách khách hàng phân trang
  @Get('admin/list')
  async getAdminUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('sort') sort: string = 'created_at'
  ) {
    try {
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

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
        .take(limitNum);

      if (search && search.trim()) {
        query = query.where(
          'user.username LIKE :search OR user.email LIKE :search OR user.phone LIKE :search OR user.full_name LIKE :search',
          { search: `%${search.trim()}%` }
        );
      }

      // Sort options: created_at, username, email
      const validSortFields = ['created_at', 'username', 'email', 'full_name'];
      const sortField = validSortFields.includes(sort) ? sort : 'created_at';
      query = query.orderBy(`user.${sortField}`, 'DESC');

      const [users, total] = await query.getManyAndCount();

      // Transform để có cả id và user_id
      const transformedUsers = users.map(user => ({
        ...user,
        id: user.user_id,
      }));

      return {
        success: true,
        data: transformedUsers,
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Lỗi khi lấy danh sách người dùng');
    }
  }

  // API Admin: Xem chi tiết user
  @Get('admin/:id')
  async getAdminUserDetail(
    @Param('id', new ParseIntPipe({ 
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      exceptionFactory: () => new BadRequestException('ID phải là số nguyên dương')
    })) id: number
  ) {
    if (id <= 0) {
      throw new BadRequestException('ID phải là số nguyên dương');
    }

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
      .where('user.user_id = :id', { id })
      .getOne();
       
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return {
      success: true,
      data: {
        ...user,
        id: user.user_id,
      }
    };
  }

  // API Admin: Cập nhật thông tin user
  @Put('admin/:id')
  async updateUser(
    @Param('id', new ParseIntPipe({ 
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      exceptionFactory: () => new BadRequestException('ID phải là số nguyên dương')
    })) id: number,
    @Body() updateData: UpdateUserDto
  ) {
    if (id <= 0) {
      throw new BadRequestException('ID phải là số nguyên dương');
    }

    try {
      // Kiểm tra user tồn tại
      const existingUser = await this.usersService.findById(id);
      if (!existingUser) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }

      await this.usersService.updateUser(id, updateData);
      
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
        .where('user.user_id = :id', { id })  
        .getOne();

      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng sau khi cập nhật');
      }

      return {
        success: true,
        message: 'Cập nhật thông tin người dùng thành công',
        data: {
          ...user,
          id: user.user_id,
        }
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Không thể cập nhật người dùng');
    }
  }

  // API Admin: Thêm user mới
  @Post('admin/createUser')
  async createUser(
    @Body() userData: CreateUserDto
  ) {
    try {
      // Kiểm tra email đã tồn tại chưa
      const existingEmail = await this.usersService.findByEmail(userData.email);
      if (existingEmail) {
        throw new BadRequestException('Email đã tồn tại trong hệ thống');
      }

      // Kiểm tra username đã tồn tại chưa
      const existingUsername = await this.usersService['usersRepo'].findOne({
        where: { username: userData.username }
      });
      if (existingUsername) {
        throw new BadRequestException('Username đã tồn tại trong hệ thống');
      }

      // Hash password trước khi lưu
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const newUser = await this.usersService.addUser({
        ...userData,
        password_hash: hashedPassword
      });
      
      // Trả về user không có password
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
        .where('user.user_id = :id', { id: newUser.user_id })
        .getOne();

      if (!user) {
        throw new BadRequestException('Không thể lấy thông tin người dùng sau khi tạo');
      }

      return {
        success: true,
        message: 'Tạo người dùng thành công',
        data: {
          ...user,
          id: user.user_id,
        }
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Không thể tạo người dùng');
    }
  }

  // API Admin: Xóa user
  @Delete('admin/:id')
  async deleteUser(
    @Param('id', new ParseIntPipe({ 
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      exceptionFactory: () => new BadRequestException('ID phải là số nguyên dương')
    })) id: number
  ) {
    if (id <= 0) {
      throw new BadRequestException('ID phải là số nguyên dương');
    }

    try {
      // Kiểm tra user tồn tại
      const existingUser = await this.usersService.findById(id);
      if (!existingUser) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }

      await this.usersService.deleteUser(id);
      return {
        success: true,
        message: 'Xóa người dùng thành công'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Không thể xóa người dùng');
    }
  }
}
  