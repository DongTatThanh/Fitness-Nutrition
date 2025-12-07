import { Controller, Post, Put, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, BadRequestException, UnauthorizedException, Req, UseInterceptors, Get } from '@nestjs/common';
import { SuperAdminGuard } from './super-admin.guard';
import { SuperAdminManagementService } from './super-admin-management.service';
import { AdminAuthService } from '../admin/admin-auth.service';
import { Admin2FAService } from '../admin/admin-2fa.service';

import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminRoleDto } from './dto/update-admin-role.dto';
import { UpdateAdminStatusDto } from './dto/update-admin-status.dto';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminLoginDto } from '../admin/dto/admin-login.dto';
import { Verify2FADto } from '../admin/dto/verify-2fa.dto';

@Controller('super-admin')

export class SuperAdminController {
  constructor(
    private superAdminManagementService: SuperAdminManagementService,
    private adminAuthService: AdminAuthService,
    private admin2FAService: Admin2FAService,
  ) {}


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
      // Yêu cầu verify 2FA token
      return {
        requires2FA: true,
        message: 'Vui lòng nhập mã 2FA để tiếp tục đăng nhập',
        adminId: admin.admin_id,
      };
    }

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

    // Lấy admin trước để kiểm tra
    const admin = await this.adminAuthService['adminService'].findById(dto.adminId);
    if (!admin) {
      throw new UnauthorizedException('Admin không tồn tại');
    }

    if (admin.role !== 'super_admin') {
      throw new UnauthorizedException('Chỉ Super Admin mới có thể đăng nhập tại đây');
    }

    // Kiểm tra 2FA đã được enable chưa
    const is2FAEnabled = await this.admin2FAService.is2FAEnabled(dto.adminId);
    if (!is2FAEnabled) {
      throw new UnauthorizedException('2FA chưa được kích hoạt cho tài khoản này');
    }

    // Verify token
    const isValid = await this.admin2FAService.verifyAdmin2FA(dto.adminId, dto.token);
    
    if (!isValid) {
      throw new UnauthorizedException(
        'Mã 2FA không đúng. ' +
        'Có thể secret trong database không khớp với app authenticator. ' +
        'Vui lòng kiểm tra: 1) App authenticator đang dùng đúng tài khoản, ' +
        '2) Thời gian thiết bị đã đồng bộ, ' +
        '3) Hoặc liên hệ admin để reset 2FA và setup lại.'
      );
    }

    return this.adminAuthService.login(admin);
  }

  /**
   * Setup 2FA cho Super Admin (không cần đã đăng nhập, dùng khi bị lock)
   * POST /super-admin/auth/setup-2fa
   * Cần email và password để xác thực, trả về secret/QR để quét trên app
   */
  @Post('auth/setup-2fa')
  async setup2FA(@Body() dto: { email: string; password: string }, @Req() req: any) {
    // Xác thực admin bằng email và password
    const admin = await this.adminAuthService.validateAdmin(dto.email, dto.password);
    if (!admin) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Kiểm tra phải là Super Admin
    if (admin.role !== 'super_admin') {
      throw new UnauthorizedException('Chỉ Super Admin mới có thể setup 2FA tại đây');
    }

    // Setup 2FA (tạo secret và QR code mới để super admin quét)
    const result = await this.admin2FAService.setup2FA(admin.admin_id, dto.password);

    return {
      ...result,
      message: 'Setup 2FA thành công. Vui lòng quét QR code trên app authenticator và sau đó gọi /super-admin/auth/enable-2fa để kích hoạt.',
    };
  }

  /**
   * Enable 2FA cho Super Admin sau khi đã quét QR
   * POST /super-admin/auth/enable-2fa
   * Cần email, password và token 2FA từ app
   */
  @Post('auth/enable-2fa')
  async enable2FA(@Body() dto: { email: string; password: string; token: string }, @Req() req: any) {
    // Xác thực admin bằng email và password
    const admin = await this.adminAuthService.validateAdmin(dto.email, dto.password);
    if (!admin) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Kiểm tra phải là Super Admin
    if (admin.role !== 'super_admin') {
      throw new UnauthorizedException('Chỉ Super Admin mới có thể enable 2FA tại đây');
    }

    // Enable 2FA bằng token sau khi đã quét QR
    const result = await this.admin2FAService.enable2FA(admin.admin_id, dto.token);

    return {
      ...result,
      message: 'Kích hoạt 2FA cho Super Admin thành công. Từ lần sau đăng nhập sẽ yêu cầu mã 2FA.',
      adminId: admin.admin_id,
    };
  }

  /**
   * Đăng xuất Super Admin
   * POST /super-admin/auth/logout
   */
  @Post('auth/logout')
  @UseGuards(SuperAdminGuard)
  async logout() {
    // Token dạng JWT nên phía server không cần xoá, client chỉ cần xoá token
    return { message: 'Đăng xuất Super Admin thành công' };
  }

  // ==================== MANAGEMENT ROUTES ====================

  /**
   * Lấy danh sách tất cả admin (chỉ Super Admin)
   * GET /super-admin/list
   */
  @Get('list')
  @UseGuards(SuperAdminGuard)
  async getAllAdmins() {
    return this.superAdminManagementService.getAllAdmins();
  }

  /**
   * Tạo admin mới (chỉ Super Admin)
   * POST /super-admin/create-admin
   */
  @Post('create-admin')
  @UseGuards(SuperAdminGuard)
  async createAdmin(@Body() createAdminDto: CreateAdminDto, @Req() req: any) {
    try {
      return await this.superAdminManagementService.createAdmin(
        createAdminDto,
        req.user?.adminId || req.user?.id
      );
    } catch (error) {
      // Nếu là validation error từ class-validator, throw lại với message rõ ràng hơn
      if (error.status === 400 || error instanceof BadRequestException) {
        throw new BadRequestException(
          error.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra: email đúng định dạng, password tối thiểu 6 ký tự, phone 10-11 số (nếu có)'
        );
      }
      throw error;
    }
  }

  /**
   * Cập nhật role của admin (chỉ Super Admin)
   * PATCH /super-admin/:id/role
   */
  @Patch(':id/role')
  @UseGuards(SuperAdminGuard)
  async updateAdminRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateAdminRoleDto,
    @Req() req: any,
  ) {
    if (id <= 0) {
      throw new BadRequestException('ID phải là số nguyên dương');
    }
    return this.superAdminManagementService.updateAdminRole(
      id,
      updateRoleDto,
      req.user?.adminId || req.user?.id
    );
  }

  /**
   * Cập nhật trạng thái admin (bật/tắt) (chỉ Super Admin)
   * PATCH /super-admin/:id/status
   */
  @Patch(':id/status')
  @UseGuards(SuperAdminGuard)
  async updateAdminStatus(
    @Param('id', ParseIntPipe) id: number,
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
        // NestJS không tự parse form-data, cần dùng multer hoặc body-parser
        // Tạm thời hướng dẫn user dùng raw JSON
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
    
    return this.superAdminManagementService.updateAdminStatus(
      id,
      updateStatusDto,
      req.user?.adminId || req.user?.id
    );
  }

  /**
   * Cập nhật thông tin admin (chỉ Super Admin)
   * PUT /super-admin/:id
   */
  @Put(':id')
  @UseGuards(SuperAdminGuard)
  async updateAdmin(
    @Param('id', ParseIntPipe) id: number,
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
    @Param('id', ParseIntPipe) id: number,
    @Body() changePasswordDto: ChangeAdminPasswordDto,
    @Req() req: any,
  ) {
    if (id <= 0) {
      throw new BadRequestException('ID phải là số nguyên dương');
    }
    return this.superAdminManagementService.changeAdminPassword(
      id,
      changePasswordDto.newPassword,
      req.user?.adminId || req.user?.id
    );
  }

  /**
   * Xóa admin (chỉ Super Admin)
   * DELETE /super-admin/:id
   */
  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  async deleteAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    if (id <= 0) {
      throw new BadRequestException('ID phải là số nguyên dương');
    }
    return this.superAdminManagementService.deleteAdmin(
      id,
      req.user?.adminId || req.user?.id
    );
  }

}
