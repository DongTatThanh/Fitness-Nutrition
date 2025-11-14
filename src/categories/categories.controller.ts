import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { CategoriesService } from "./categories.service";

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

    // API Admin: Lấy danh sách danh mục phân trang
    @Get('admin/list/all')
    async getAdminCategories(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('search') search?: string
    ) {
        const skip = (Number(page) - 1) * Number(limit);
        let query = this.categoriesService['categoriesRepository']
            .createQueryBuilder('category')
            .skip(skip)
            .take(Number(limit));

        if (search) {
            query = query.where('category.name LIKE :search', {
                search: `%${search}%`
            });
        }

        query = query.orderBy('category.id', 'ASC');

        const [categories, total] = await query.getManyAndCount();

        return {
            data: categories,
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
        };
    }

    // Lấy category theo id
    @Get(':id')
    async findById(@Param('id', ParseIntPipe) id: number) {
        return this.categoriesService.findById(id);
    }

    // Lấy category kèm sản phẩm
    @Get(':id/products')
    async findCategoryWithProducts(@Param('id', ParseIntPipe) id: number) {
        return this.categoriesService.findCategoryWithProducts(id);
    }
}
