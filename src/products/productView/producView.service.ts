import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductView } from './productView.entity';


@Injectable()
export class ProductViewService {
  constructor(
    @InjectRepository(ProductView)
    private readonly productViewRepository: Repository<ProductView>,
  ) {}



}