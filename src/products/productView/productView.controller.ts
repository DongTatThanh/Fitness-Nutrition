

import { Controller, Get } from '@nestjs/common';
import { ProductViewService } from './producView.service';
import { Param } from '@nestjs/common';
import { ParseIntPipe } from '@nestjs/common';


@Controller('product-views')
export class ProductViewController {
  constructor(private readonly productViewService: ProductViewService) {}


  // lấy sản phẩm user đã xem 
 
  }

