import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BadRequestException } from '@nestjs/common';
import { ProductView } from './productView.entity';

@Injectable()
export class ProductViewService {
    constructor(
        @InjectRepository(ProductView)
        private productViewRepository: Repository<ProductView>,
    ) {}

    // lấy danh sách tất cả các lượt xem sản phẩm của id user

    async getProductViewsByUser ( user_Id: number) {

       return await this.productViewRepository.find({
           where:{ user : { id: user_Id } },
            relations:['product' , 'user'],
            order: { viewedAt: 'DESC' },
         });
    }

}
