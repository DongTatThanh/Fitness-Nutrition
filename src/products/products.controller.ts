import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private svc: ProductsService) {}

  @Get()
  getAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findById(id);
  }

  @Get(':id/variants')
  getVariants(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findVariants(id);
  }
}
