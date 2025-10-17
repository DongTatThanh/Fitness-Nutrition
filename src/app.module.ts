import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { Product } from './products/product.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { DiscountCodeModule } from './discount_code/discount_code.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    // Serve static files từ folder uploads
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASS ?? '123456',
      database: process.env.DB_NAME ?? 'gymsinhvien',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // set to true for local development only
      logging: false,
    }),
    TypeOrmModule.forFeature([User, Product]),
    UsersModule,
    AuthModule,
    CartModule,
    DiscountCodeModule,
    ProductsModule,
    CategoriesModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
