

import { Controller, Get } from '@nestjs/common';
import { ProductViewService } from './producView.service';
import { Param } from '@nestjs/common';
import { ParseIntPipe } from '@nestjs/common';


@Controller('product-views')
export class ProductViewController {
  constructor(private readonly productViewService: ProductViewService) {}


  // lấy sản phẩm user đã xem 
  @Get(':userId/products')
  async getProductViewsByUser(@Param('userId', ParseIntPipe) user_Id: number) {
    const views =  await this.productViewService.getProductViewsByUser(user_Id);
    return {
      user : user_Id,
      totalViews : views.length,
      viewProducts : views.map(view => ({
        viewedAt: view.viewedAt,
        product: view.product,
      })),
    }
  }

}