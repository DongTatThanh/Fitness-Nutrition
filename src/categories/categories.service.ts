import { Injectable, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm"; 
import { Category } from "./category.entity";

@Injectable()
export class CategoriesService {  
 constructor(  
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>
  ) {}

  // Lấy tất cả các danh mục categories
  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { is_active: true },
      order: { name: "ASC" },
    });
  }

  // Lấy category theo id
  async findById(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id, is_active: true }
    });
    
    if (!category) {
      throw new NotFoundException(`Category với ID ${id} không tồn tại`);
    }

    return category;
  }

  // Lấy category kèm sản phẩm
  async findCategoryWithProducts(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id, is_active: true },
        relations: ['products', 'products.brand']
    });
    
    if (!category) {
      throw new NotFoundException(`Category với ID ${id} không tồn tại`); 
    }

    return category;
  }

  // Lấy tất cả danh mục categories kèm sản phẩm
  async findAllCategoriesWithProducts() {
    const categories = await this.categoriesRepository.find({
      where: { is_active: true },
      relations: ['products', 'products.brand'],
      order: { sort_order: 'ASC' }
    });

    return categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      products: cat.products
    }));
  }

  // Cập nhật ảnh category
  async updateCategoryImage(id: number, imageUrl: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id }
    });

    if (!category) {
      throw new NotFoundException(`Category với ID ${id} không tồn tại`);
    }

    category.image_url = imageUrl;
    return this.categoriesRepository.save(category);
  }
}