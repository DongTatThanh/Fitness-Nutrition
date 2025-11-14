import 'reflect-metadata';
import { config } from 'dotenv';
config(); // Load .env file FIRST
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';

async function bootstrap() {
  // Debug environment variables
  console.log('🔧 Environment Variables Check:');
  console.log('PORT:', process.env.PORT);
  console.log('HOST:', process.env.HOST);
  console.log('SMTP_HOST:', process.env.SMTP_HOST ? ' Set' : ' Missing');
  console.log('SMTP_USER:', process.env.SMTP_USER ? ' Set' : ' Missing');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? ' Set' : ' Missing');
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for cross-origin requests
  app.enableCors({
    origin: [
      'http://localhost:8081',
      'http://localhost:3000',
      'http://localhost:5173', // Admin frontend
      'http://localhost:5174', // Admin frontend (Vite auto port)
      'http://127.0.0.1:8081',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      /^http:\/\/192\.168\.\d+\.\d+:8081$/, // LAN access
      /^http:\/\/10\.\d+\.\d+\.\d+:8081$/, // Private network
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: true, 
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (errors) => {
      const messages = errors.map(error => {
        const constraints = error.constraints;
        return Object.values(constraints || {}).join(', ');
      });
      console.log(' Validation errors:', messages);
      return new BadRequestException(messages.join(', '));
    }
  }));

  const port = process.env.PORT ?? 3201;
  const host = process.env.HOST ?? '0.0.0.0'; 
  
  await app.listen(port, host);
  console.log(` Server running on http://${host}:${port}`);
  console.log(` Available on LAN at http://YOUR_IP:${port}`);
}

bootstrap();
