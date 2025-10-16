import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
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

    // Lấy tất cả categories kèm sản phẩm (PHẢI ĐẶT TRƯỚC :id)
    @Get('all/with-products')
    async findAllCategoriesWithProducts() {
        return this.categoriesService.findAllCategoriesWithProducts();
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
