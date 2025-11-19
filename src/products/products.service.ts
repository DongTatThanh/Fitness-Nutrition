
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Product } from 'src/products/product.entity';
import { ProductImage } from './product-image.entity';
import { ProductVariant } from './product-variant.entity';
import { CreateProductDto } from './dto/createProductDto';
import { UpdateProductDto } from './dto/updateproductDto';
import { AdminProductFilterDto } from './dto/getProductDto';
import { CreateVariantDto, UpdateVariantDto } from './dto/variant.dto';



@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
  ) {}
 /// lấy tất cả các danh sách sản phẩm

    async findAll(): Promise<Product[]> {
      return await this.productsRepository.find({
        order: {
          created_at: 'DESC'   
        }   
      });
    }
    // lấy tất cả các sản phẩm đang được giảm giá

   async findOnSaleProducts(limit: number = 10): Promise<Product[]> {
  return await this.productsRepository
  
    .createQueryBuilder('product')
    .leftJoinAndSelect('product.brand', 'brand')
    .leftJoinAndSelect('product.category', 'category')
    .where('product.compare_price > product.price')
    .andWhere('product.compare_price IS NOT NULL')// không có giá gốc thì bỏ qua 
    .addOrderBy('(product.compare_price - product.price) / product.price', 'DESC') // sản phẩm nào discount lớn hơn sẽ xếp đầu 
    .limit(limit)
    .getMany();
}
// lấy các sản phẩm bán chạy nhất 
  async findBestSellers(limit: number = 10): Promise<Product[]> {
    const result = await this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoin('order_items', 'oi', 'oi.product_id = product.id')
      .leftJoin('orders', 'o', 'o.id = oi.order_id')
      .select([
        'product.id',
        'product.name',
        'product.slug',
        'product.sku',
        'product.price',
        'product.compare_price',
        'product.featured_image',
        'product.short_description',
        'brand.id',
        'brand.name',
        'category.id',
        'category.name'
      ])
      .addSelect('COALESCE(SUM(oi.quantity), 0)', 'total_sold')  // tổng số lượng đã bán
      .where('o.status IN (:...statuses)', { 
        statuses: ['completed', 'delivered', 'processing'] 
      })
      .groupBy('product.id')
      .addGroupBy('brand.id')
      .addGroupBy('category.id')
      .orderBy('total_sold', 'DESC')
      .addOrderBy('product.created_at', 'DESC')
      .limit(limit)
      .getRawAndEntities();   // trả về các ánh xạ  và sql 
    
    return result.entities;
}

  // Cập nhật ảnh product
  async updateProductImage(productId: number, imageUrl: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id: productId }
    });

        if (!product) {
      throw new NotFoundException(`Product với ID ${productId} không tồn tại`);
    }

    product.featured_image = imageUrl;
    return this.productsRepository.save(product);
  }

  // lấy chi tiết sản phẩm theo id
  async findProductsId(productId: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: {
        id: productId,
        status: 'active',
      },
      relations: ['brand', 'category', 'variants', 'reviews', 'attributes', 'images'],
    });

    if (!product) {
      throw new NotFoundException(`Product với ID ${productId} không tồn tại`);
    }

    return product;
  }
  //  lấy sản phẩm trong khoảng giá , sắp xếp, 
 async getProductsByCategory(filter: {
  categoryId: number;
  isFlashSale?: boolean;

  priceMin?: number;
  priceMax?: number;
  brandId?: number;
  sort?: string;
  page: number;
  limit: number;
}) {
  const query = this.productsRepository.createQueryBuilder('product');

if (filter.categoryId) {
   query.where('product.category_id = :categoryId', { categoryId: filter.categoryId });
} else {
  query.where('product.category_id = :categoryId', { categoryId: filter.categoryId });
}

  if (filter.priceMin !== undefined) {
    query.andWhere('product.price >= :minPrice', { minPrice: filter.priceMin });
  }
  if (filter.priceMax !== undefined) {
    query.andWhere('product.price <= :maxPrice', { maxPrice: filter.priceMax });
  }
  if (filter.brandId !== undefined) {
    query.andWhere('product.brand_id = :brandId', { brandId: filter.brandId });
  }


  switch (filter.sort) {
    case 'price_asc':
      query.orderBy('product.price', 'ASC');
      break;
    case 'price_desc':
      query.orderBy('product.price', 'DESC');
      break;
    case 'name_asc':
      query.orderBy('product.name', 'ASC');
      break;
    case 'name_desc':
      query.orderBy('product.name', 'DESC');
      break;
    default:
      query.orderBy('product.created_at', 'DESC');
      break;
  }

  query.skip((filter.page - 1) * filter.limit).take(filter.limit);

  const [data, total] = await query.getManyAndCount();

  return {
    data,
    total,
    currentPage: filter.page,
    totalPages: Math.ceil(total / filter.limit),
  };
}

  //---------------admin

  private applyDtoToProduct(product: Product, dto: Partial<CreateProductDto | UpdateProductDto>) {
    if (dto.name !== undefined) product.name = dto.name;
    if (dto.slug !== undefined) product.slug = dto.slug;
    if (dto.sku !== undefined) product.sku = dto.sku;
    if (dto.brandId !== undefined) product.brand_id = dto.brandId;
    if (dto.categoryId !== undefined) product.category_id = dto.categoryId;
    if (dto.shortDescription !== undefined) product.short_description = dto.shortDescription;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.ingredients !== undefined) product.ingredients = dto.ingredients;
    if (dto.usageInstructions !== undefined) product.usage_instructions = dto.usageInstructions;
    if (dto.warnings !== undefined) product.warnings = dto.warnings;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.comparePrice !== undefined) product.compare_price = dto.comparePrice;
    if (dto.costPrice !== undefined) product.cost_price = dto.costPrice;
    if (dto.trackInventory !== undefined) product.track_inventory = dto.trackInventory;
    if (dto.inventoryQuantity !== undefined) product.inventory_quantity = dto.inventoryQuantity;
    // Xử lý quantity từ frontend
    if ('quantity' in dto && dto['quantity'] !== undefined) {
      product.inventory_quantity = dto['quantity'];
    }
    if (dto.lowStockThreshold !== undefined) product.low_stock_threshold = dto.lowStockThreshold;
    if (dto.expiryDate !== undefined) {
      product.expiry_date = dto.expiryDate ? new Date(dto.expiryDate) : null;
    }
    if (dto.batchNumber !== undefined) product.batch_number = dto.batchNumber;
    if (dto.originCountry !== undefined) product.origin_country = dto.originCountry;
    if (dto.manufacturer !== undefined) product.manufacturer = dto.manufacturer;
    if (dto.featuredImage !== undefined) product.featured_image = dto.featuredImage;
    if (dto.metaTitle !== undefined) product.meta_title = dto.metaTitle;
    if (dto.metaDescription !== undefined) product.meta_description = dto.metaDescription;
    if (dto.isFeatured !== undefined) product.is_featured = dto.isFeatured;
    if (dto.isNewArrival !== undefined) product.is_new_arrival = dto.isNewArrival;
    if (dto.isBestseller !== undefined) product.is_bestseller = dto.isBestseller;
    if (dto.isOnSale !== undefined) product.is_on_sale = dto.isOnSale;
    if (dto.status !== undefined) product.status = dto.status;
    if (dto.publishedAt !== undefined) {
      product.published_at = dto.publishedAt ? new Date(dto.publishedAt) : null;
    }
  }

  private buildImageEntities(urls?: string[]) {
    if (!urls || !urls.length) return [];
    return urls.map((url, index) => {
      const image = new ProductImage();
      image.imageUrl = url;
      image.sortOrder = index;
      return image;
    });
  }

  async getAdminProducts(filter: AdminProductFilterDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      brandId,
      categoryId,
      isFeatured,
      isNewArrival,
      isBestseller,
      isOnSale,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = filter;

    const query = this.productsRepository
      .createQueryBuilder('product')
      .select([
        'product.id',
        'product.name',
        'product.slug',
        'product.sku',
        'product.price',
        'product.compare_price',
        'product.inventory_quantity',
        'product.featured_image',
        'product.status',
        'product.is_featured',
        'product.is_new_arrival',
        'product.is_bestseller',
        'product.is_on_sale',
        'product.created_at',
        'product.updated_at',
      ])
      .addSelect(['brand.id', 'brand.name', 'brand.logo_url'])
      .addSelect(['category.id', 'category.name'])
      .leftJoin('product.brand', 'brand')
      .leftJoin('product.category', 'category')
      .orderBy(`product.${sortBy}`, sortOrder as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      query.andWhere('(product.name LIKE :search OR product.sku LIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (status) query.andWhere('product.status = :status', { status });
    if (brandId) query.andWhere('product.brand_id = :brandId', { brandId });
    if (categoryId) query.andWhere('product.category_id = :categoryId', { categoryId });
    if (isFeatured !== undefined) query.andWhere('product.is_featured = :isFeatured', { isFeatured });
    if (isNewArrival !== undefined) query.andWhere('product.is_new_arrival = :isNewArrival', { isNewArrival });
    if (isBestseller !== undefined) query.andWhere('product.is_bestseller = :isBestseller', { isBestseller });
    if (isOnSale !== undefined) query.andWhere('product.is_on_sale = :isOnSale', { isOnSale });

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAdminProductById(id: number) {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['brand', 'category', 'variants', 'attributes', 'reviews', 'images'],
    });

    if (!product) {
      throw new NotFoundException(`Product với ID ${id} không tồn tại`);
    }

    // Format lại gallery_images từ relation images để frontend dễ xử lý
    const galleryImages = product.images 
      ? product.images.sort((a, b) => a.sortOrder - b.sortOrder).map(img => img.imageUrl)
      : [];

    return {
      ...product,
      gallery_images: galleryImages,
    };
  }

  // admin thêm sản phẩm mới
  async createProductAdmin(dto: CreateProductDto) {
    const product = this.productsRepository.create();
    this.applyDtoToProduct(product, dto);
    product.images = this.buildImageEntities(dto.galleryImages);
    
    // Nếu chưa có featured_image nhưng có galleryImages, lấy ảnh đầu tiên làm featured_image
    if (!product.featured_image && dto.galleryImages && dto.galleryImages.length > 0) {
      product.featured_image = dto.galleryImages[0];
    }
    
    return this.productsRepository.save(product);
  }

  // admin cập nhật sản phẩm
  async updateProductAdmin(id: number, dto: UpdateProductDto) {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['images'],
    });

    if (!product) {
      throw new NotFoundException(`Product với ID ${id} không tồn tại`);
    }

    this.applyDtoToProduct(product, dto);

    if (dto.galleryImages) {
      await this.productImageRepository.delete({ productId: product.id });
      product.images = this.buildImageEntities(dto.galleryImages);
    }

    return this.productsRepository.save(product);
  }

  // admin xóa sản phẩm
  async deleteProductAdmin(id: number): Promise<void> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product với ID ${id} không tồn tại`);
    }
    await this.productsRepository.delete(id);
  }

  // Migration: Fix featured_image cho các sản phẩm thiếu ảnh
  async fixProductImages() {
    const products = await this.productsRepository.find({
      relations: ['images'],
    });

    let fixed = 0;
    for (const product of products) {
      if (!product.featured_image && product.images && product.images.length > 0) {
        product.featured_image = product.images[0].imageUrl;
        await this.productsRepository.save(product);
        fixed++;
      }
    }

    return {
      success: true,
      message: `Đã fix ${fixed} sản phẩm thiếu ảnh đại diện`,
      total: products.length,
      fixed,
    };
  }

  // ============== VARIANT MANAGEMENT ==============
  
  // Lấy danh sách variants của sản phẩm
  async getProductVariants(productId: number) {
    const product = await this.productsRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    const variants = await this.variantRepository.find({
      where: { product_id: productId },
      order: { id: 'ASC' }
    });

    return {
      success: true,
      data: variants
    };
  }

  // Thêm variant mới
  async addProductVariant(productId: number, variantDto: CreateVariantDto) {
    const product = await this.productsRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    const variant = this.variantRepository.create({
      product_id: productId,
      variant_name: variantDto.variant_name,
      sku: variantDto.sku || `${product.sku}-V${Date.now()}`,
      price: variantDto.price,
      compare_price: variantDto.compare_price,
      inventory_quantity: variantDto.quantity,
      image_url: variantDto.image,
      is_active: variantDto.status === 'active',
    });

    // Parse attribute_values if provided
    if (variantDto.attribute_values) {
      const attrs = variantDto.attribute_values;
      if (attrs.flavor) variant.flavor = attrs.flavor;
      if (attrs.size) variant.size = attrs.size;
      if (attrs.color) variant.color = attrs.color;
      if (attrs.weight) variant.weight = attrs.weight;
      if (attrs.weight_unit) variant.weight_unit = attrs.weight_unit;
    }

    await this.variantRepository.save(variant);

    return {
      success: true,
      message: 'Đã thêm variant thành công',
      data: variant
    };
  }

  // Cập nhật variant
  async updateVariant(variantId: number, variantDto: UpdateVariantDto) {
    const variant = await this.variantRepository.findOne({ where: { id: variantId } });
    if (!variant) {
      throw new NotFoundException('Không tìm thấy variant');
    }

    if (variantDto.variant_name !== undefined) variant.variant_name = variantDto.variant_name;
    if (variantDto.sku !== undefined) variant.sku = variantDto.sku;
    if (variantDto.price !== undefined) variant.price = variantDto.price;
    if (variantDto.compare_price !== undefined) variant.compare_price = variantDto.compare_price;
    if (variantDto.quantity !== undefined) variant.inventory_quantity = variantDto.quantity;
    if (variantDto.image !== undefined) variant.image_url = variantDto.image;
    if (variantDto.status !== undefined) variant.is_active = variantDto.status === 'active';

    // Update attributes if provided
    if (variantDto.attribute_values) {
      const attrs = variantDto.attribute_values;
      if (attrs.flavor !== undefined) variant.flavor = attrs.flavor;
      if (attrs.size !== undefined) variant.size = attrs.size;
      if (attrs.color !== undefined) variant.color = attrs.color;
      if (attrs.weight !== undefined) variant.weight = attrs.weight;
      if (attrs.weight_unit !== undefined) variant.weight_unit = attrs.weight_unit;
    }

    await this.variantRepository.save(variant);

    return {
      success: true,
      message: 'Đã cập nhật variant thành công',
      data: variant
    };
  }

  // Xóa variant
  async deleteVariant(variantId: number) {
    const variant = await this.variantRepository.findOne({ where: { id: variantId } });
    if (!variant) {
      throw new NotFoundException('Không tìm thấy variant');
    }

    await this.variantRepository.remove(variant);

    return {
      success: true,
      message: 'Đã xóa variant thành công'
    };
  }
}




