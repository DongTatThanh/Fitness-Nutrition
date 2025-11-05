import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { BrandsService } from "./brands.service";


@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}


     // lấy tất cả các thương hiệu 
  @Get()
  async findAll() 
  {
    return this.brandsService.findBrandAll();
  }
    
   // lấy tất cả các thương hiệu nổi bật 
  @Get(':featured')
  async findFeaturedBrands(@Param('featured') featured: string)
   {

      return this.brandsService.findFeaturedBrands();

  }


  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.findBrandWithProducts(id);
  }

  @Get('all/brands')
   async findAllBrands() {
     return this.brandsService.findAllBrands(); 
   }
}
  