import { InjectRepository } from '@nestjs/typeorm';
import { Store } from './store.entity';


import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';



@Injectable()
export class StoresService {

    constructor(
        @InjectRepository(Store)
        private readonly storeRepository: Repository<Store>,
    ) {}   

    // lấy tất cả cửa hàng 
    async findAllStores(): Promise<Store[]> {
        return await this.storeRepository.find({
            order: {
                created_at: 'DESC'
              }   
        });
    }
}
