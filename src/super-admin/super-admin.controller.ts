import { Controller, Get, Post, Put, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, BadRequestException, HttpException, HttpStatus, UnauthorizedException, Req, Query, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SuperAdminGuard } from './super-admin.guard';
import { SuperAdminManagementService } from './super-admin-management.service';
import { AdminAuthService } from '../admin/admin-auth.service';
import { AdminResponseInterceptor } from '../admin/admin-response.interceptor';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminRoleDto } from './dto/update-admin-role.dto';
import { UpdateAdminStatusDto } from './dto/update-admin-status.dto';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminLoginDto } from '../admin/dto/admin-login.dto';

@Controller('super-admin')
@UseInterceptors(AdminResponseInterceptor)
export class SuperAdminController {
  constructor(
    private superAdminManagementService: SuperAdminManagementService,
    private adminAuthService: AdminAuthService,
  ) {}

  /**
   * Helper method để lấy IP address và User Agent từ request
   */
  private getRequestInfo(req: any) {
    const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return { ipAddress, userAgent };
  }

  // ==================== AUTH ROUTES ====================

  /**
   * Đăng nhập Super Admin
   * POST /super-admin/auth/login
   */
  @Post('auth/login')
  async login(@Body() dto: AdminLoginDto, @Req() req: any) {
    const admin = await this.adminAuthService.validateAdmin(dto.email, dto.password);
    if (!admin) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng. Vui lòng thử lại');
    }

    // Kiểm tra phải là Super Admin
    if (admin.role !== 'super_admin') {
      throw new UnauthorizedException('Chỉ Super Admin mới có thể đăng nhập tại đây. Vui lòng sử dụng trang đăng nhập Admin thường');
    }

    // Log login activity
    const { ipAddress, userAgent } = this.getRequestInfo(req);
    await this.superAdminManagementService.logActivity({
      user_id: admin.admin_id,
      action: 'LOGIN',
      entity_type: 'admin',
      entity_id: admin.admin_id,
      details: { email: admin.email, role: admin.role },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return this.adminAuthService.login(admin);
  }

  /**
   * Lấy thông tin Super Admin đang đăng nhập
   * GET /super-admin/auth/me
   */
  @Get('auth/me')
  @UseGuards(SuperAdminGuard)
  getMe(@Req() req: any) {
    return req.user;
  }

  /**
   * Lấy profile Super Admin
   * GET /super-admin/auth/profile
   */
  @Get('auth/profile')
  @UseGuards(SuperAdminGuard)
  getProfile(@Req() req: any) {
    return req.user;
  }

  /**
   * Đăng xuất Super Admin
   * POST /super-admin/auth/logout
   */
  @Post('auth/logout')
  @UseGuards(SuperAdminGuard)
  async logout(@Req() req: any) {
    return { message: 'Đăng xuất thành công' };
  }

  // ==================== MANAGEMENT ROUTES ====================

  /**
   * Tạo admin mới (chỉ Super Admin)
   * POST /super-admin/create-admin
   */
  @Post('create-admin')
  @UseGuards(SuperAdminGuard)
  async createAdmin(@Body() createAdminDto: CreateAdminDto, @Req() req: any) {
    const { ipAddress, userAgent } = this.getRequestInfo(req);
    return this.superAdminManagementService.createAdmin(
      createAdminDto,
      req.user?.adminId || req.user?.id,
      ipAddress,
      userAgent
    );
  }

  /**
   * Lấy danh sách tất cả admin (chỉ Super Admin)
   * GET /super-admin/list
   * Phải đặt trước route :id để tránh conflict
   */
  @Get('list')
  @UseGuards(SuperAdminGuard)
  async getAllAdmins() {
    try {
      return await this.superAdminManagementService.getAllAdmins();
    } catch (error) {
      throw new HttpException(
        error.message || 'Lỗi khi lấy danh sách admin',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Lấy thông tin chi tiết admin (chỉ Super Admin)
   * GET /super-admin/:id
   * Phải đặt sau route cụ thể như 'list'
   */
  @Get(':id')
  @UseGuards(SuperAdminGuard)
  async getAdminById(@Param('id', new ParseIntPipe({ 
    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
    exceptionFactory: () => new BadRequestException('ID phải là số nguyên dương')
  })) id: number) {
    if (id <= 0) {
      throw new BadRequestException('ID phải là số nguyên dương');
    }
    try {
      return await this.superAdminManagementService.getAdminById(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Lỗi khi lấy thông tin admin',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Cập nhật role của admin (chỉ Super Admin)
   * PATCH /super-admin/:id/role
   */
  @Patch(':id/role')
  @UseGuards(SuperAdminGuard)
  async updateAdminRole(
    @Param('id', new ParseIntPipe({ 
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      exceptionFactory: () => new BadRequestException('ID phải là số nguyên dương')
    })) id: number,
    @Body() updateRoleDto: UpdateAdminRoleDto,
    @Req() req: any,
  ) {
    if (id <= 0) {
      throw new BadRequestException('ID phải là số nguyên dương');
    }
    const { ipAddress, userAgent } = this.getRequestInfo(req);
    return this.superAdminManagementService.updateAdminRole(
      id,
      updateRoleDto,
      req.user?.adminId || req.user?.id,
      ipAddress,
      userAgent
    );
  }

  /**
   * Cập nhật trạng thái admin (bật/tắt) (chỉ Super Admin)
   * PATCH /super-admin/:id/status
   */
  @Patch(':id/status')
  @UseGuards(SuperAdminGuard)
  async updateAdminStatus(
    @Param('id', new ParseIntPipe({ 
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      exceptionFactory: () => new BadRequestException('ID phải là số nguyên dương')
    })) id: number,
    @Body() updateStatusDto: UpdateAdminStatusDto,
    @Req() req: any,
  ) {
    if (id <= 0) {
      throw new BadRequestException('ID phải là số nguyên dương');
    }
    const { ipAddress, userAgent } = this.getRequestInfo(req);
    return this.superAdminManagementService.updateAdminStatus(
      id,
      updateStatusDto,
      req.user?.adminId || req.user?.id,
      ipAddress,
      userAgent
    );
  }

  /**
   * Cập nhật thông tin admin (chỉ Super Admin)
   * PUT /super-admin/:id
   */
  @Put(':id')
  @UseGuards(SuperAdminGuard)
  async updateAdmin(
    @Param('id', new ParseIntPipe({ 
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      exceptionFactory: () => new BadRequestException('ID phải là số nguyên dương')
    })) id: number,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    if (id <= 0) {
      throw new BadRequestException('ID phải là số nguyên dương');
    }
    // Kiểm tra ít nhất một trường được cập nhật
    if (!updateAdminDto.full_name && !updateAdminDto.phone) {
      throw new BadRequestException('Phải cập nhật ít nhất một trường: full_name hoặc phone');
    }
    return this.superAdminManagementService.updateAdmin(id, updateAdminDto);
  }

  /**
   * Đổi mật khẩu admin (chỉ Super Admin)
   * PATCH /super-admin/:id/password
   */
  @Patch(':id/password')
  @UseGuards(SuperAdminGuard)
  async changeAdminPassword(
    @Param('id', new ParseIntPipe({ 
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      exceptionFactory: () => new BadRequestException('ID phải là số nguyên dương')
    })) id: number,
    @Body() changePasswordDto: ChangeAdminPasswordDto,
    @Req() req: any,
  ) {
    if (id <= 0) {
      throw new BadRequestException('ID phải là số nguyên dương');
    }
    const { ipAddress, userAgent } = this.getRequestInfo(req);
    return this.superAdminManagementService.changeAdminPassword(
      id,
      changePasswordDto.newPassword,
      req.user?.adminId || req.user?.id,
      ipAddress,
      userAgent
    );
  }

  /**
   * Xóa admin (chỉ Super Admin)
   * DELETE /super-admin/:id
   */
  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  async deleteAdmin(
    @Param('id', new ParseIntPipe({ 
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      exceptionFactory: () => new BadRequestException('ID phải là số nguyên dương')
    })) id: number,
    @Req() req: any,
  ) {
    if (id <= 0) {
      throw new BadRequestException('ID phải là số nguyên dương');
    }
    const { ipAddress, userAgent } = this.getRequestInfo(req);
    return this.superAdminManagementService.deleteAdmin(
      id,
      req.user?.adminId || req.user?.id,
      ipAddress,
      userAgent
    );
  }

  // ==================== ACTIVITY LOGS ROUTES ====================

  /**
   * Lấy danh sách activity logs (chỉ Super Admin)
   * GET /super-admin/activity-logs
   */
  @Get('activity-logs')
  @UseGuards(SuperAdminGuard)
  async getActivityLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('user_id') userId?: string,
    @Query('action') action?: string,
    @Query('entity_type') entityType?: string,
  ) {
    try {
      // Parse query parameters an toàn
      const pageNum = page ? (isNaN(Number(page)) ? undefined : Number(page)) : undefined;
      const limitNum = limit ? (isNaN(Number(limit)) ? undefined : Number(limit)) : undefined;
      const userIdNum = userId ? (isNaN(Number(userId)) ? undefined : Number(userId)) : undefined;

      return await this.superAdminManagementService.getActivityLogs({
        page: pageNum,
        limit: limitNum,
        user_id: userIdNum,
        action: action || undefined,
        entity_type: entityType || undefined,
      });
    } catch (error) {
      throw new HttpException(
        error.message || 'Lỗi khi lấy danh sách activity logs',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Lấy chi tiết activity log (chỉ Super Admin)
   * GET /super-admin/activity-logs/:id
   */
  @Get('activity-logs/:id')
  @UseGuards(SuperAdminGuard)
  async getActivityLogById(
    @Param('id', new ParseIntPipe({ 
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      exceptionFactory: () => new BadRequestException('ID phải là số nguyên dương')
    })) id: number,
  ) {
    if (id <= 0) {
      throw new BadRequestException('ID phải là số nguyên dương');
    }
    return this.superAdminManagementService.getActivityLogById(id);
  }
}

