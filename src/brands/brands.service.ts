import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Brand } from "./brand.entity";
import { Product } from "../products/product.entity";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  // Admin: Tạo nhãn hàng
  async createBrand(createBrandDto: CreateBrandDto): Promise<Brand> {
    const existingSlug = await this.brandsRepository.findOne({
      where: { slug: createBrandDto.slug },
    });

    if (existingSlug) {
      throw new BadRequestException('Slug đã tồn tại, vui lòng chọn slug khác.');
    }

    const brand = this.brandsRepository.create({
      ...createBrandDto,
      is_active: createBrandDto.is_active ?? true,
    });

    return await this.brandsRepository.save(brand);
  }

  // Admin: Cập nhật nhãn hàng
  async updateBrand(id: number, updateBrandDto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.brandsRepository.findOne({ where: { id } });

    if (!brand) {
      throw new NotFoundException(`Brand với ID ${id} không tồn tại`);
    }

    if (updateBrandDto.slug && updateBrandDto.slug !== brand.slug) {
      const slugExists = await this.brandsRepository.findOne({
        where: { slug: updateBrandDto.slug },
      });

      if (slugExists) {
        throw new BadRequestException('Slug đã tồn tại, vui lòng chọn slug khác.');
      }
    }

    Object.assign(brand, updateBrandDto);
    return await this.brandsRepository.save(brand);
  }

  // Admin: Xóa nhãn hàng
  async deleteBrand(id: number): Promise<void> {
    const brand = await this.brandsRepository.findOne({ where: { id } });

    if (!brand) {
      throw new NotFoundException(`Brand với ID ${id} không tồn tại`);
    }

    const productCount = await this.productsRepository.count({
      where: { brand_id: id },
    });

    if (productCount > 0) {
      throw new BadRequestException('Không thể xóa thương hiệu đang có sản phẩm. Vui lòng cập nhật sản phẩm trước.');
    }

    await this.brandsRepository.remove(brand);
  }

  // Admin: Danh sách nhãn hàng với pagination/filter
  async getAdminBrands(options: {
    search?: string;
    page?: number;
    limit?: number;
    is_active?: boolean;
    is_featured?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 10;
    const qb = this.brandsRepository.createQueryBuilder('brand');

    if (options.search) {
      qb.where('(brand.name LIKE :search OR brand.slug LIKE :search)', {
        search: `%${options.search}%`,
      });
    }

    if (typeof options.is_active === 'boolean') {
      qb.andWhere('brand.is_active = :isActive', { isActive: options.is_active });
    }

    if (typeof options.is_featured === 'boolean') {
      qb.andWhere('brand.is_featured = :isFeatured', { isFeatured: options.is_featured });
    }

    const sortableFields = ['name', 'created_at', 'sort_order'];
    const sortField = sortableFields.includes(options.sortBy || '') ? options.sortBy : 'created_at';
    const sortOrder = options.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(`brand.${sortField}`, sortOrder);
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Admin: Thông tin chi tiết + thống kê
  async getBrandDetailsWithStats(id: number) {
    const brand = await this.brandsRepository.findOne({ where: { id } });

    if (!brand) {
      throw new NotFoundException(`Brand với ID ${id} không tồn tại`);
    }

    const totalProducts = await this.productsRepository.count({ where: { brand_id: id } });
    const activeProducts = await this.productsRepository.count({
      where: { brand_id: id, status: 'active' as any },
    });

    return {
      brand,
      stats: {
        totalProducts,
        activeProducts,
        inactiveProducts: totalProducts - activeProducts,
      },
    };
  }

  // Admin: cập nhật trạng thái
  async updateBrandStatus(id: number, isActive: boolean): Promise<Brand> {
    const brand = await this.brandsRepository.findOne({ where: { id } });

    if (!brand) {
      throw new NotFoundException(`Brand với ID ${id} không tồn tại`);
    }

    brand.is_active = isActive;
    return await this.brandsRepository.save(brand);
  }

  // Lấy tất cả các thương hiệu
  async findBrandAll(): Promise<Brand[]> 
  {
    return await this.brandsRepository.find
    (
      {
      where: { is_active: true },
      order: { name: "ASC" }
    });
  }

  // Lấy thương hiệu kèm sản phẩm (cải thiện với pagination, filter, sort)
  async findBrandWithProducts(
    id: number,
    options?: {
      page?: number;
      limit?: number;
      status?: string;
      minPrice?: number;
      maxPrice?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }
  ): Promise<{
    brand: Partial<Brand>;
    products: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    // Lấy thông tin brand
    const brand = await this.brandsRepository.findOne({
      where: { id, is_active: true },
    });

    if (!brand) {
      throw new NotFoundException(`Brand với ID ${id} không tồn tại`);
    }

    // Thiết lập mặc định cho options
    const page = options?.page || 1;
    const limit = options?.limit || 12;
    const status = options?.status || 'active';
    const sortBy = options?.sortBy || 'created_at';
    const sortOrder = options?.sortOrder || 'DESC';

    // Query builder để đếm tổng số sản phẩm (trước khi pagination)
    const countQueryBuilder = this.brandsRepository
      .createQueryBuilder('brand')
      .leftJoin('brand.products', 'product')
      .where('brand.id = :id', { id })
      .andWhere('brand.is_active = :isActive', { isActive: true })
      .andWhere('product.status = :status', { status });

    // Filter theo giá cho count query
    if (options?.minPrice) {
      countQueryBuilder.andWhere('product.price >= :minPrice', { minPrice: options.minPrice });
    }
    if (options?.maxPrice) {
      countQueryBuilder.andWhere('product.price <= :maxPrice', { maxPrice: options.maxPrice });
    }

    // Đếm tổng số sản phẩm
    const total = await countQueryBuilder
      .select('COUNT(DISTINCT product.id)', 'count')
      .getRawOne()
      .then((result) => parseInt(result?.count || '0', 10));

    // Query builder để lấy sản phẩm với filter và pagination
    const queryBuilder = this.brandsRepository
      .createQueryBuilder('brand')
      .leftJoinAndSelect('brand.products', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'productBrand')
      .where('brand.id = :id', { id })
      .andWhere('brand.is_active = :isActive', { isActive: true })
      .andWhere('product.status = :status', { status });

    // Filter theo giá
    if (options?.minPrice) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice: options.minPrice });
    }
    if (options?.maxPrice) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice: options.maxPrice });
    }

    // Sort
    if (sortBy === 'price') {
      queryBuilder.orderBy('product.price', sortOrder);
    } else if (sortBy === 'name') {
      queryBuilder.orderBy('product.name', sortOrder);
    } else if (sortBy === 'created_at') {
      queryBuilder.orderBy('product.created_at', sortOrder);
    } else {
      queryBuilder.orderBy('product.created_at', 'DESC');
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Lấy kết quả
    const result = await queryBuilder.getOne();

    if (!result) {
      return {
        brand,
        products: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    // Format sản phẩm
    const products = (result.products || []).map((product) => {
      const inventoryQuantity = Number(product.inventory_quantity ?? 0);
      const stockQuantity = Number(
        (product as any).stock_quantity ?? product.inventory_quantity ?? 0,
      );

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        price: product.price,
        compare_price: product.compare_price,
        featured_image: product.featured_image,
        short_description: product.short_description,
        is_featured: product.is_featured,
        is_new_arrival: product.is_new_arrival,
        is_bestseller: product.is_bestseller,
        is_on_sale: product.is_on_sale,
        status: product.status,
        inventory_quantity: inventoryQuantity,
        stock_quantity: stockQuantity,
        category: product.category
          ? {
              id: product.category.id,
              name: product.category.name,
              slug: product.category.slug,
            }
          : null,
      };
    });

    return {
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo_url: brand.logo_url,
        banner_url: brand.banner_url,
        description: brand.description,
        country: brand.country,
        website: brand.website,
        is_verified: brand.is_verified,
        is_featured: brand.is_featured,
      },
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  // lấy các thương hiệu nổi bật bằng is_featured
  async findFeaturedBrands(): Promise<Brand[]> {
    return await this.brandsRepository.find
    (
      {
      where: { is_featured: true,
                 is_active:true
      },
      order: { name: "ASC" }
    } 
  );
  }

  // Cập nhật logo_url cho brand
  async updateBrandImage(id: number, imageUrl: string): Promise<Brand> {
    const brand = await this.brandsRepository.findOne
    ({ where: { id } });
    
    if (!brand) {
      throw new NotFoundException(`Brand với ID ${id} không tồn tại`);
    }

    brand.logo_url = imageUrl;
    return await this.brandsRepository.save(brand);
  }


  // lấy danh sách hãng sản suất
  async findAllBrands(): Promise<Brand[]> {
    return await this.brandsRepository.find({
      where: { is_active: true },
      order: { name: "ASC" }
    });
  }

  // Lấy thông tin thương hiệu theo ID (không có sản phẩm)
  async findBrandById(id: number): Promise<Brand> {
    const brand = await this.brandsRepository.findOne({
      where: { id, is_active: true },
    });

    if (!brand) {
      throw new NotFoundException(`Brand với ID ${id} không tồn tại`);
    }

    return brand;
  }
}

