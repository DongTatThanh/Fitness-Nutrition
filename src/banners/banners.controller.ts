import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BannersService } from './banners.service';
import { Banner } from './banner.entity';

@Controller('banners')
export class BannersController {
  constructor(private bannersService: BannersService) {}

  // GET /banners - Lấy tất cả banner
  @Get()
  async findAll() {
    return this.bannersService.findAllBanners();
  }

  // GET /banners/position/:position - Lấy banner theo vị trí
  @Get('position/:position')
  async findByPosition(@Param('position', ParseIntPipe) position: number) {
    return this.bannersService.findBannersByPosition(position);
  }

  // GET /banners/:id - Lấy banner theo ID
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bannersService.findBannerById(id);
  }

  // POST /banners - Tạo banner mới
  @Post()
  async create(@Body() bannerData: Partial<Banner>) {
    return this.bannersService.createBanner(bannerData);
  }

  // PUT /banners/:id - Cập nhật banner (với upload ảnh)
  @Put(':id')
  @UseInterceptors(
    FileInterceptor('image_url', {
      storage: diskStorage({
        destination: './uploads/banners',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `banner-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async updateBanner(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    if (!body && !file) {
      throw new BadRequestException('Không có dữ liệu cập nhật');
    }

    // Nếu có file mới thì gán đường dẫn
    if (file) {
      body.image_url = `/uploads/banners/${file.filename}`;
    }

    return await this.bannersService.updateBanner(id, body);
  }

  // DELETE /banners/:id - Xóa banner
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.bannersService.deleteBanner(id);
    return { message: 'Banner deleted successfully' };
  }
}
