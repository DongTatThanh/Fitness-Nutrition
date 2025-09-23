import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/info')
  getApiInfo() {
    return {
      name: 'Fitness Nutrition API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3201,
      endpoints: {
        auth: [
          'POST /auth/register',
          'POST /auth/login', 
          'POST /auth/logout',
          'GET /auth/profile',
          'PUT /auth/profile',
          'POST /auth/forgot-password',
          'POST /auth/reset-password'
        ],
        products: [
          'GET /products',
          'GET /products/:id',
          'GET /products/:id/variants'
        ],
        catalog: [
          'GET /brands',
          'GET /categories'
        ],
        cart: [
          'GET /cart',
          'POST /cart/items',
          'PUT /cart/items/:id', 
          'DELETE /cart/items/:id',
          'DELETE /cart'
        ]
      }
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
}
