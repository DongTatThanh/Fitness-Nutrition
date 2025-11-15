import { get } from 'http';
import { Injectable, NotFoundException, Query, Search } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm"; 
import { Category } from "./category.entity";
import { CreateCategoryDto } from './dto/createCategotyDto';
import { UpdateCategoryDto } from './dto/update.CategoryDto';

 


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
      products: cat.products,
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


  // admin 

 
  // Lấy all categories cho admin
  async getAllCategoriesAdmin( 
    page: number,
    limit: number,
    search?: string,
    status?: 'active' | 'inactive'
  ) {
    const skip = (page - 1) * limit;

    let query = this.categoriesRepository.createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent')
      .skip(skip)
      .take(limit);

    if (search) {
      query = query.where('category.name LIKE :search OR category.slug LIKE :search', { 
        search: `%${search}%` 
      });
    } 

    if (status) {
      query = query.andWhere('category.status = :status', { status });
    }

    query = query.orderBy('category.sort_order', 'ASC')
      .addOrderBy('category.name', 'ASC');

    const [categories, total] = await query.getManyAndCount();

    return {
      data: categories,
      total,  
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }
    
    
   // lấy chi tiết category theo id cho admin 

    async getCategoryByIdAdmin(id: number)
    {
      return await this.categoriesRepository
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.parent ', 'parentCategory')
        .leftJoinAndSelect('category.children', 'childCategories')
          .where('category.id = :id', { id })
          .getOne();
    }

    // thêm mới danh mục category
    async createCategoryAdmin(categoryData: CreateCategoryDto)
    {
      const newCategory = this.categoriesRepository.create(categoryData);
      return await this.categoriesRepository.save(newCategory);

    }

    // cập nhật category
    async updateCategoryAdmin(id: number, categoryData:UpdateCategoryDto)
    {
      await this.categoriesRepository.update({id}, categoryData);
      return this.categoriesRepository.findOne(
        {where: {id},
      relations: ['parent']});



    }

    // xáo category
    async deleteCategoryAdmin(id: number)
    {
    return await this.categoriesRepository.delete({id});
    

    }

    // findBySlug
    async findBySlug(slug: string)
     {
      return await this.categoriesRepository.findOne({
        where: { slug, is_active: true },
      
      });
     }
     
    }

