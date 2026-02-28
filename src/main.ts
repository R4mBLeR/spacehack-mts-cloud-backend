import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './modules/app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

const envFile =
  process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';

dotenv.config({ path: path.join(process.cwd(), envFile) });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['authorization', 'content-type', 'accept'],
    exposedHeaders: ['authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        console.log('=== VALIDATION ERRORS ===');
        console.log(JSON.stringify(errors, null, 2));
        console.log('========================');
        return new BadRequestException(errors);
      },
    }),
  );

  // ВАЖНО: В докере берем PORT из process.env, который прокидывает docker-compose
  const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
  const swaggerPath = process.env.SWAGGER_PATH || 'swagger';

  const swaggerConfig = new DocumentBuilder()
    .setTitle(process.env.SWAGGER_TITLE || 'API')
    .setDescription(process.env.SWAGGER_DESCRIPTION || 'API documentation')
    .setVersion(process.env.SWAGGER_VERSION || '1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerPath, app, document);

  await app.listen(port, '0.0.0.0'); // Слушаем на всех интерфейсах внутри контейнера
  console.log(`🚀 Server: http://localhost:${port}/api`);
  console.log(`🚀 Running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📚 Swagger: http://localhost:${port}/${swaggerPath}`);
}

bootstrap();
