import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { BrandsService } from "./brands.service";


@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  async findAll() {
    return this.brandsService.findBrandAll();
  }
  @Get(':featured')
  async findFeaturedBrands(@Param('featured') featured: boolean) {

      return this.brandsService.findFeaturedBrands();

  }


  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.findBrandWithProducts(id);
  }
}
  