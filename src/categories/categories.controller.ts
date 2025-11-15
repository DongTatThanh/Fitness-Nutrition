import { Controller, Get, Param, ParseIntPipe, Post, Put, Delete, Query, Body, NotFoundException, BadRequestException } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/createCategotyDto";
import { UpdateCategoryDto } from "./dto/update.CategoryDto";

@Controller('categories')
export class CategoriesController {
    constructor(
        private readonly categoriesService: CategoriesService
    ) {}
     
    // Lấy tất cả các danh mục categories
    @Get()  
    async findAll() {
        return this.categoriesService.findAll();
    }

    // Lấy tất cả categories kèm sản phẩm 
    @Get('all/with-products')
    async findAllCategoriesWithProducts() {
        return this.categoriesService.findAllCategoriesWithProducts();
    }

    // ==================== API ADMIN ====================

    // Lấy tất cả categories cho admin (phân trang)
    @Get('admin/list/all')
    async getAllCategoriesAdmin(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('search') search?: string,
        @Query('status') status?: 'active' | 'inactive'
    ) {
        return await this.categoriesService.getAllCategoriesAdmin(
            Number(page),
            Number(limit),
            search,
            status
        );
    }

    // Lấy chi tiết category theo id cho admin
    @Get('admin/:id')
    async getCategoryByIdAdmin(@Param('id') id: string) {
        const category = await this.categoriesService.getCategoryByIdAdmin(Number(id));
        
        if (!category) {
            throw new NotFoundException('Danh mục không tồn tại');
        }
        
        return category;
    }  
    
    // Thêm category mới (Admin)
    @Post('admin')
    async createCategory(@Body() createData: CreateCategoryDto) {
        try {
            const existingCategory = await this.categoriesService.findBySlug(createData.slug);

            if (existingCategory) {
                throw new BadRequestException('Slug đã tồn tại');
            }

            const savedCategory = await this.categoriesService.createCategoryAdmin(createData);

            return {
                success: true,
                message: 'Tạo danh mục thành công',
                data: savedCategory
            };
        } catch (error) {
            throw new BadRequestException(error.message || 'Không thể tạo danh mục');
        }
    }

    // Cập nhật category (Admin)
    @Put('admin/:id')
    async updateCategory(
        @Param('id') id: string,
        @Body() updateData: UpdateCategoryDto
    ) {
        try {
            const category = await this.categoriesService.getCategoryByIdAdmin(Number(id));

            if (!category) {
                throw new NotFoundException('Không tìm thấy danh mục');
            }

            if (updateData.slug && updateData.slug !== category.slug) {
                const existingCategory = await this.categoriesService.findBySlug(updateData.slug);

                if (existingCategory) {
                    throw new BadRequestException('Slug đã tồn tại');
                }
            }

            const updatedCategory = await this.categoriesService.updateCategoryAdmin(Number(id), updateData);

            return {
                success: true,
                message: 'Cập nhật danh mục thành công',
                data: updatedCategory
            };
        } catch (error) {
            throw new BadRequestException(error.message || 'Không thể cập nhật danh mục');
        }
    }

    // Xóa category (Admin)
    @Delete('admin/:id')
    async deleteCategory(@Param('id') id: string) {
        try {
            const category = await this.categoriesService.getCategoryByIdAdmin(Number(id));

            if (!category) {
                throw new NotFoundException('Không tìm thấy danh mục');
            }

            // Kiểm tra có danh mục con không

            // Kiểm tra có sản phẩm không
            if (category.products && category.products.length > 0) {
                throw new BadRequestException('Không thể xóa danh mục có sản phẩm. Vui lòng di chuyển sản phẩm sang danh mục khác trước.');
            }

            await this.categoriesService.deleteCategoryAdmin(Number(id));

            return {
                success: true,
                message: 'Xóa danh mục thành công'
            };
        } catch (error) {
            throw new BadRequestException(error.message || 'Không thể xóa danh mục');
        }
    }

    // ==================== API PUBLIC ====================

    // Lấy category theo id (Public)
    @Get(':id')
    async findById(@Param('id', ParseIntPipe) id: number) {
        return this.categoriesService.findById(id);
    }

    // Lấy category kèm sản phẩm (Public)
    @Get(':id/products')
    async findCategoryWithProducts(@Param('id', ParseIntPipe) id: number) {
        return this.categoriesService.findCategoryWithProducts(id);
    }
}