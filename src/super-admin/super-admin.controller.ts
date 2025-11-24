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
import { Verify2FADto } from '../admin/dto/verify-2fa.dto';
import { Setup2FADto } from '../admin/dto/setup-2fa.dto';
import { Enable2FADto } from '../admin/dto/enable-2fa.dto';
import { Admin2FAService } from '../admin/admin-2fa.service';

@Controller('super-admin')
@UseInterceptors(AdminResponseInterceptor)
export class SuperAdminController {
  constructor(
    private superAdminManagementService: SuperAdminManagementService,
    private adminAuthService: AdminAuthService,
    private admin2FAService: Admin2FAService,
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

    // Kiểm tra nếu admin đã bật 2FA
    const is2FAEnabled = await this.admin2FAService.is2FAEnabled(admin.admin_id);
    
    if (is2FAEnabled) {
      // Tạo temp token cho 2FA verification
      const tempToken = await this.adminAuthService.createTempToken(admin);
      
      // Yêu cầu verify 2FA token
      return {
        requires2FA: true,
        temp_token: tempToken,
        adminId: admin.admin_id,
      };
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
   * Verify 2FA token khi login Super Admin
   * POST /super-admin/auth/verify-2fa-login
   */
  @Post('auth/verify-2fa-login')
  async verify2FALogin(@Body() dto: Verify2FADto & { adminId: number }, @Req() req: any) {
    if (!dto.adminId) {
      throw new BadRequestException('Admin ID không được để trống');
    }

    const isValid = await this.admin2FAService.verifyAdmin2FA(dto.adminId, dto.token);
    
    if (!isValid) {
      throw new UnauthorizedException('Mã 2FA không đúng. Vui lòng thử lại.');
    }

    // Lấy admin và kiểm tra phải là Super Admin
    const admin = await this.adminAuthService['adminService'].findById(dto.adminId);
    if (!admin) {
      throw new UnauthorizedException('Admin không tồn tại');
    }

    if (admin.role !== 'super_admin') {
      throw new UnauthorizedException('Chỉ Super Admin mới có thể đăng nhập tại đây');
    }

    // Log login activity
    const { ipAddress, userAgent } = this.getRequestInfo(req);
    await this.superAdminManagementService.logActivity({
      user_id: admin.admin_id,
      action: 'LOGIN',
      entity_type: 'admin',
      entity_id: admin.admin_id,
      details: { email: admin.email, role: admin.role, with2FA: true },
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

  // ==================== 2FA ENDPOINTS ====================

  /**
   * Setup 2FA - Tạo secret và QR code
   * POST /super-admin/auth/2fa/setup
   */
  @Post('auth/2fa/setup')
  @UseGuards(SuperAdminGuard)
  async setup2FA(@Body() dto: Setup2FADto, @Req() req: any) {
    const adminId = req.user?.adminId || req.user?.id || req.user?.sub;
    return this.admin2FAService.setup2FA(adminId, dto.password);
  }

  /**
   * Enable 2FA - Kích hoạt sau khi verify token
   * POST /super-admin/auth/2fa/enable
   */
  @Post('auth/2fa/enable')
  @UseGuards(SuperAdminGuard)
  async enable2FA(@Body() dto: Enable2FADto, @Req() req: any) {
    const adminId = req.user?.adminId || req.user?.id || req.user?.sub;
    return this.admin2FAService.enable2FA(adminId, dto.token);
  }

  /**
   * Disable 2FA - Tắt 2FA
   * POST /super-admin/auth/2fa/disable
   */
  @Post('auth/2fa/disable')
  @UseGuards(SuperAdminGuard)
  async disable2FA(@Body() dto: Setup2FADto, @Req() req: any) {
    const adminId = req.user?.adminId || req.user?.id || req.user?.sub;
    return this.admin2FAService.disable2FA(adminId, dto.password);
  }

  /**
   * Kiểm tra trạng thái 2FA
   * GET /super-admin/auth/2fa/status
   */
  @Get('auth/2fa/status')
  @UseGuards(SuperAdminGuard)
  async get2FAStatus(@Req() req: any) {
    const adminId = req.user?.adminId || req.user?.id || req.user?.sub;
    const isEnabled = await this.admin2FAService.is2FAEnabled(adminId);
    return {
      is2FAEnabled: isEnabled,
    };
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
    @Body() body: any,
    @Req() req: any,
  ) {
    if (id <= 0) {
      throw new BadRequestException('ID phải là số nguyên dương');
    }
    
    // Xử lý cả form-data và JSON
    let requestBody: any = body;
    
    // Nếu @Body() trả về undefined, thử dùng req.body
    if (!requestBody || Object.keys(requestBody).length === 0) {
      requestBody = req.body;
    }
    
    // Nếu vẫn undefined, có thể là form-data - thử parse từ req
    if (!requestBody || Object.keys(requestBody).length === 0) {
      // Kiểm tra nếu là form-data
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
        throw new BadRequestException(
          'Vui lòng chuyển sang raw JSON trong Postman. ' +
          'Chọn tab Body → raw → JSON, sau đó nhập: {"is_active": 0} hoặc {"is_active": 1}'
        );
      }
    }
    
    // Xử lý và validate is_active thủ công
    let isActive: number;
    
    if (requestBody?.is_active === undefined || requestBody?.is_active === null) {
      throw new BadRequestException(
        'Trạng thái không được để trống. ' +
        'Vui lòng chọn raw JSON trong Postman (Body → raw → JSON) và gửi: {"is_active": 0} hoặc {"is_active": 1}'
      );
    }
    
    // Chuyển đổi sang number
    if (typeof requestBody.is_active === 'string') {
      const num = parseInt(requestBody.is_active.trim(), 10);
      if (isNaN(num) || (num !== 0 && num !== 1)) {
        throw new BadRequestException('Trạng thái phải là 0 (vô hiệu hóa) hoặc 1 (kích hoạt)');
      }
      isActive = num;
    } else if (typeof requestBody.is_active === 'boolean') {
      isActive = requestBody.is_active ? 1 : 0;
    } else if (typeof requestBody.is_active === 'number') {
      if (requestBody.is_active !== 0 && requestBody.is_active !== 1) {
        throw new BadRequestException('Trạng thái phải là 0 (vô hiệu hóa) hoặc 1 (kích hoạt)');
      }
      isActive = requestBody.is_active;
    } else {
      throw new BadRequestException('Trạng thái phải là số (0 hoặc 1)');
    }
    
    // Tạo DTO object
    const updateStatusDto: UpdateAdminStatusDto = { is_active: isActive };
    
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

