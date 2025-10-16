import { Injectable, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "./category.entity";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  // Lấy tất cả các danh mục categories
  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { is_active: 1 },
      order: { name: "ASC" },
    });
  }

  // Lấy category theo id
  async findById(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { category_id: id, is_active: 1 }
    });
    
    if (!category) {
      throw new NotFoundException(`Category với ID ${id} không tồn tại`);
    }

    return category;
  }

  // Lấy category kèm sản phẩm
  async findCategoryWithProducts(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { category_id: id, is_active: 1 },
      relations: ['products', 'products.brand']
    });
    
    if (!category) {
      throw new NotFoundException(`Category với ID ${id} không tồn tại`);
    }

    return category;
  }
}