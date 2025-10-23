
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductView } from './productView.entity';
import { ProductViewService } from './producView.service';
import { ProductViewController } from './productView.controller';




@Module({
   imports: [TypeOrmModule.forFeature([ProductView])],
   providers: [ProductViewService],
   exports: [ProductViewService],
   controllers: [ProductViewController],
   
   
})
export class ProductViewModule {}
