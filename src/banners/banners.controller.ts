import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BannersService } from './banners.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';

@Controller('banners')
export class BannersController {
  constructor(private bannersService: BannersService) {}

  // ============== PUBLIC ROUTES ==============

  // GET /banners - Lấy tất cả banner active (public)
  @Get()
  async findAll() {
    return this.bannersService.findAllBanners();
  }

  // GET /banners/position/:position - Lấy banner theo vị trí (public)
  @Get('position/:position')
  async findByPosition(@Param('position', ParseIntPipe) position: number) {
    return this.bannersService.findBannersByPosition(position);
  }

  // ============== ADMIN ROUTES ==============

  // GET /banners/admin/list - Lấy danh sách banner cho admin (có phân trang)
  @Get('admin/list')
  async getAdminBanners(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('position') position?: string,
    @Query('is_active') is_active?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    const positionNum = position ? parseInt(position) : undefined;
    const isActive = is_active === 'true' ? true : is_active === 'false' ? false : undefined;

    return this.bannersService.getAdminBanners(pageNum, limitNum, positionNum, isActive);
  }

  // POST /banners/admin - Tạo banner mới (với upload ảnh)
  @Post('admin')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/banners',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `banner-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new BadRequestException('Chỉ chấp nhận file ảnh'), false);
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async createBanner(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng upload ảnh banner');
    }

    // Validate required fields
    if (!body.name) {
      throw new BadRequestException('Tên banner là bắt buộc');
    }
    if (!body.position || body.position === '') {
      throw new BadRequestException('Vị trí banner là bắt buộc');
    }

    // Parse position
    const position = parseInt(body.position);
    if (isNaN(position)) {
      throw new BadRequestException('Vị trí banner phải là số');
    }

    // Parse sort_order
    let sort_order = 0;
    if (body.sort_order && body.sort_order !== '') {
      sort_order = parseInt(body.sort_order);
      if (isNaN(sort_order)) {
        throw new BadRequestException('Thứ tự sắp xếp phải là số');
      }
    }

    // Parse created_by
    let created_by: number | undefined = undefined;
    if (body.created_by && body.created_by !== '') {
      const parsed = parseInt(body.created_by);
      if (isNaN(parsed)) {
        throw new BadRequestException('created_by phải là số');
      }
      created_by = parsed;
    }

    // Parse FormData fields to proper types
    const createBannerDto: CreateBannerDto & { image_url: string } = {
      name: body.name,
      image_url: `/uploads/banners/${file.filename}`,
      link_url: body.link_url,
      link_target: body.link_target || '_self',
      position: position,
      sort_order: sort_order,
      start_date: body.start_date,
      end_date: body.end_date,
      is_active: body.is_active === 'true' || body.is_active === true,
      created_by: created_by,
    };

    return this.bannersService.createBanner(createBannerDto);
  }

  // GET /banners/admin/:id - Lấy chi tiết banner
  @Get('admin/:id')
  async getAdminBanner(@Param('id', ParseIntPipe) id: number) {
    return this.bannersService.findBannerById(id);
  }

  // PUT /banners/admin/:id - Cập nhật banner (với upload ảnh)
  @Put('admin/:id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/banners',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `banner-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new BadRequestException('Chỉ chấp nhận file ảnh'), false);
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async updateBanner(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    // Parse FormData fields to proper types
    const updateBannerDto: UpdateBannerDto = {};
    
    if (body.name) updateBannerDto.name = body.name;
    if (body.link_url !== undefined) updateBannerDto.link_url = body.link_url;
    if (body.link_target) updateBannerDto.link_target = body.link_target;
    
    // Parse number fields - chỉ parse nếu có giá trị
    if (body.position && body.position !== '') {
      const pos = parseInt(body.position);
      if (!isNaN(pos)) updateBannerDto.position = pos;
    }
    if (body.sort_order !== undefined && body.sort_order !== '') {
      const sortOrder = parseInt(body.sort_order);
      if (!isNaN(sortOrder)) updateBannerDto.sort_order = sortOrder;
    }
    
    if (body.start_date) updateBannerDto.start_date = body.start_date;
    if (body.end_date) updateBannerDto.end_date = body.end_date;
    if (body.is_active !== undefined) {
      updateBannerDto.is_active = body.is_active === 'true' || body.is_active === true;
    }

    // Nếu có file mới thì gán đường dẫn
    if (file) {
      updateBannerDto.image_url = `/uploads/banners/${file.filename}`;
    }

    return this.bannersService.updateBanner(id, updateBannerDto);
  }

  // DELETE /banners/admin/:id - Xóa banner
  @Delete('admin/:id')
  async deleteBanner(@Param('id', ParseIntPipe) id: number) {
    await this.bannersService.deleteBanner(id);
    return {
      success: true,
      message: 'Xóa banner thành công',
    };
  }

  // PUT /banners/admin/:id/toggle-active - Bật/tắt trạng thái banner
  @Put('admin/:id/toggle-active')
  async toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.bannersService.toggleActive(id);
  }

  // ============== DYNAMIC ROUTES (PHẢI ĐẶT CUỐI) ==============

  // GET /banners/:id - Lấy banner theo ID (public)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bannersService.findBannerById(id);
  }
}
