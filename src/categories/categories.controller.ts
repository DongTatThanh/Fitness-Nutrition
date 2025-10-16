import { Controller, Get, Param } from "@nestjs/common";
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

    // Lấy category theo id
    @Get(':id')
    async findById(@Param('id') id: number) {
        return this.categoriesService.findById(+id);
    }

    // Lấy category kèm sản phẩm
    @Get(':id/products')
    async findCategoryWithProducts(@Param('id') id: number) {
        return this.categoriesService.findCategoryWithProducts(+id);
    }
}
