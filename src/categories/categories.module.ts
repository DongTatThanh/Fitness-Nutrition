
import { Module as moduler } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/entities/category.entity';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { ProductsModule } from 'src/products/products.module';

@moduler({
    imports: [TypeOrmModule.forFeature([Category]), ProductsModule],
       imports: [TypeOrmModule.
        forFeature([Category]),
        ProductsModule
    ],
    controllers: [CategoriesController],
    providers: [CategoriesService]
})
export class CategoriesModule {}