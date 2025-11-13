import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductView } from './product-view.entity';
import { ProductViewService } from './product-view.service';
import { ProductViewController } from './product-view.controller';

@Module({
    imports: [TypeOrmModule.forFeature([ProductView])],
    providers: [ProductViewService],
    controllers: [ProductViewController],
    exports: [ProductViewService],
})
export class ProductViewModule {}
