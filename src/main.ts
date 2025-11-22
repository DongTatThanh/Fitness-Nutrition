import 'reflect-metadata';
import { config } from 'dotenv';
config(); // Load .env file FIRST
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for cross-origin requests
  app.enableCors({
    origin: [
      'http://localhost:8081',
      'http://localhost:3000',
      'http://localhost:3002', // Super Admin frontend
      'http://localhost:5173', // Admin frontend
      'http://localhost:5174', // Admin frontend (Vite auto port)
      'http://127.0.0.1:8081',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      /^http:\/\/192\.168\.\d+\.\d+:8081$/, // LAN access
      /^http:\/\/192\.168\.\d+\.\d+:3002$/, // LAN access for Super Admin
      /^http:\/\/10\.\d+\.\d+\.\d+:8081$/, // Private network
      /^http:\/\/10\.\d+\.\d+\.\d+:3002$/, // Private network for Super Admin
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: false, // Cho phép extra fields để @Transform xử lý
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
      excludeExtraneousValues: false, // Không loại bỏ fields không có @Expose
    },
    exceptionFactory: (errors) => {
      const messages = errors.map(error => {
        const constraints = error.constraints;
        if (constraints) {
          // Lấy message đầu tiên (đã được định nghĩa bằng tiếng Việt trong DTO)
          return Object.values(constraints)[0];
        }
        return `${error.property} không hợp lệ`;  
      });
      return new BadRequestException(messages.join('; '));
    }
  }));

  const port = process.env.PORT ?? 3201;
  const host = process.env.HOST ?? '0.0.0.0'; 
  
  await app.listen(port, host);
  console.log(` Server running on http://${host}:${port}`);
  console.log(` Available on LAN at http://YOUR_IP:${port}`);
}

bootstrap();
