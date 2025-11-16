import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Product } from '../products/product.entity';
import { Category } from '../categories/category.entity';
import { Brand } from '../brands/brand.entity';
import { Store } from '../stores/store.entity';

export interface SearchResult {
  products: {
    data: any[];
    total: number;
  };
  categories: {
    data: any[];
    total: number;
  };
  brands: {
    data: any[];
    total: number;
  };
  stores: {
    data: any[];
    total: number;
  };
  total: number;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  /**
   * Tìm kiếm tổng hợp trong tất cả các entities
   * @param query - Từ khóa tìm kiếm
   * @param limit - Số lượng kết quả tối đa cho mỗi loại (mặc định: 10)
   * @param types - Các loại cần tìm kiếm (mặc định: tất cả)
   * @returns Kết quả tìm kiếm từ tất cả các nguồn
   */
  async searchAll(
    query: string,
    limit: number = 10,
    types?: ('products' | 'categories' | 'brands' | 'stores')[],
  ): Promise<SearchResult> {
    // Nếu không có query hoặc query rỗng, trả về kết quả rỗng
    if (!query || query.trim().length === 0) {
      return {
        products: { data: [], total: 0 },
        categories: { data: [], total: 0 },
        brands: { data: [], total: 0 },
        stores: { data: [], total: 0 },
        total: 0,
      };
    }

    const searchQuery = query.trim();
    const searchTypes = types || ['products', 'categories', 'brands', 'stores'];

    // Tìm kiếm song song (parallel) để tối ưu hiệu suất
    const searchPromises: Promise<any>[] = [];

    // 1. Tìm kiếm Products
    if (searchTypes.includes('products')) {
      searchPromises.push(this.searchProducts(searchQuery, limit));
    } else {
      searchPromises.push(Promise.resolve({ data: [], total: 0 }));
    }

    // 2. Tìm kiếm Categories
    if (searchTypes.includes('categories')) {
      searchPromises.push(this.searchCategories(searchQuery, limit));
    } else {
      searchPromises.push(Promise.resolve({ data: [], total: 0 }));
    }

    // 3. Tìm kiếm Brands
    if (searchTypes.includes('brands')) {
      searchPromises.push(this.searchBrands(searchQuery, limit));
    } else {
      searchPromises.push(Promise.resolve({ data: [], total: 0 }));
    }

    // 4. Tìm kiếm Stores
    if (searchTypes.includes('stores')) {
      searchPromises.push(this.searchStores(searchQuery, limit));
    } else {
      searchPromises.push(Promise.resolve({ data: [], total: 0 }));
    }

    // Chờ tất cả các promise hoàn thành
    const [products, categories, brands, stores] = await Promise.all(searchPromises);

    // Tính tổng số kết quả
    const total = products.total + categories.total + brands.total + stores.total;

    return {
      products,
      categories,
      brands,
      stores,
      total,
    };
  }

  /**
   * Tìm kiếm sản phẩm
   * Tìm trong: name, slug, sku, short_description, description
   */
  private async searchProducts(query: string, limit: number) {
    const searchPattern = `%${query}%`;

    // Sử dụng QueryBuilder để tìm kiếm trong nhiều trường
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.status = :status', { status: 'active' }) // Chỉ lấy sản phẩm đang active
      .andWhere(
        '(product.name LIKE :query OR ' +
          'product.slug LIKE :query OR ' +
          'product.sku LIKE :query OR ' +
          'product.short_description LIKE :query OR ' +
          'product.description LIKE :query)',
        { query: searchPattern },
      )
      .orderBy('product.is_featured', 'DESC') // Sản phẩm nổi bật lên trước
      .addOrderBy('product.created_at', 'DESC')
      .limit(limit)
      .getMany();

    // Đếm tổng số kết quả (không giới hạn)
    const total = await this.productRepository
      .createQueryBuilder('product')
      .where('product.status = :status', { status: 'active' })
      .andWhere(
        '(product.name LIKE :query OR ' +
          'product.slug LIKE :query OR ' +
          'product.sku LIKE :query OR ' +
          'product.short_description LIKE :query OR ' +
          'product.description LIKE :query)',
        { query: searchPattern },
      )
      .getCount();

    // Format dữ liệu trả về
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      price: product.price,
      compare_price: product.compare_price,
      featured_image: product.featured_image,
      short_description: product.short_description,
      brand: product.brand ? { id: product.brand.id, name: product.brand.name } : null,
      category: product.category ? { id: product.category.id, name: product.category.name } : null,
      is_featured: product.is_featured,
      is_on_sale: product.is_on_sale,
      status: product.status,
    }));

    return {
      data: formattedProducts,
      total,
    };
  }

  /**
   * Tìm kiếm danh mục
   * Tìm trong: name, slug, description
   */
  private async searchCategories(query: string, limit: number) {
    const searchPattern = `%${query}%`;

    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .where('category.is_active = :isActive', { isActive: true })
      .andWhere(
        '(category.name LIKE :query OR category.slug LIKE :query OR category.description LIKE :query)',
        { query: searchPattern },
      )
      .orderBy('category.is_featured', 'DESC')
      .addOrderBy('category.sort_order', 'ASC')
      .limit(limit)
      .getMany();

    const total = await this.categoryRepository
      .createQueryBuilder('category')
      .where('category.is_active = :isActive', { isActive: true })
      .andWhere(
        '(category.name LIKE :query OR category.slug LIKE :query OR category.description LIKE :query)',
        { query: searchPattern },
      )
      .getCount();

    const formattedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image_url: category.image_url,
      icon_class: category.icon_class,
      is_featured: category.is_featured,
    }));

    return {
      data: formattedCategories,
      total,
    };
  }

  /**
   * Tìm kiếm thương hiệu
   * Tìm trong: name, slug, description
   */
  private async searchBrands(query: string, limit: number) {
    const searchPattern = `%${query}%`;

    const brands = await this.brandRepository
      .createQueryBuilder('brand')
      .where('brand.is_active = :isActive', { isActive: true })
      .andWhere(
        '(brand.name LIKE :query OR brand.slug LIKE :query OR brand.description LIKE :query)',
        { query: searchPattern },
      )
      .orderBy('brand.is_featured', 'DESC')
      .addOrderBy('brand.sort_order', 'ASC')
      .limit(limit)
      .getMany();

    const total = await this.brandRepository
      .createQueryBuilder('brand')
      .where('brand.is_active = :isActive', { isActive: true })
      .andWhere(
        '(brand.name LIKE :query OR brand.slug LIKE :query OR brand.description LIKE :query)',
        { query: searchPattern },
      )
      .getCount();

    const formattedBrands = brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logo_url: brand.logo_url,
      banner_url: brand.banner_url,
      description: brand.description,
      country: brand.country,
      is_verified: brand.is_verified,
      is_featured: brand.is_featured,
    }));

    return {
      data: formattedBrands,
      total,
    };
  }

  /**
   * Tìm kiếm cửa hàng
   * Tìm trong: name, address, description
   */
  private async searchStores(query: string, limit: number) {
    const searchPattern = `%${query}%`;

    const stores = await this.storeRepository
      .createQueryBuilder('store')
      .where('store.is_active = :isActive', { isActive: true })
      .andWhere(
        '(store.name LIKE :query OR store.address LIKE :query OR store.description LIKE :query)',
        { query: searchPattern },
      )
      .orderBy('store.created_at', 'DESC')
      .limit(limit)
      .getMany();

    const total = await this.storeRepository
      .createQueryBuilder('store')
      .where('store.is_active = :isActive', { isActive: true })
      .andWhere(
        '(store.name LIKE :query OR store.address LIKE :query OR store.description LIKE :query)',
        { query: searchPattern },
      )
      .getCount();

    const formattedStores = stores.map((store) => ({
      id: store.id,
      name: store.name,
      address: store.address,
      hotline: store.hotline,
      support_phone: store.support_phone,
      email: store.email,
      opening_hours: store.opening_hours,
      image: store.image,
      map_link: store.map_link,
      latitude: store.latitude,
      longitude: store.longitude,
    }));

    return {
      data: formattedStores,
      total,
    };
  }
}

