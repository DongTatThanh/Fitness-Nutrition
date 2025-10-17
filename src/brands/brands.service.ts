import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Brand } from "./brand.entity";

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,
  ) {}

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

  // Lấy thương hiệu kèm sản phẩm
  async findBrandWithProducts(id: number): Promise<Brand>
   {
    const brand = await this.brandsRepository.findOne
    (
      {
      where: { id, is_active: true },
      relations: ['products', 'products.category'],
      }
  );

    if (!brand) {
      throw new NotFoundException(`Brand với ID ${id} không tồn tại`);
    }

    return brand;
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
    const brand = await this.brandsRepository.findOne({ where: { id } });
    
    if (!brand) {
      throw new NotFoundException(`Brand với ID ${id} không tồn tại`);
    }

    brand.logo_url = imageUrl;
    return await this.brandsRepository.save(brand);
  }
  }