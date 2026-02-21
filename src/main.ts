import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './modules/app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Загружаем нужный .env в зависимости от NODE_ENV
const envFile =
  process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';

dotenv.config({ path: path.join(process.cwd(), envFile) });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const port = process.env.PORT ? parseInt(process.env.PORT) : 5050;
  const swaggerPath = process.env.SWAGGER_PATH || 'swagger';

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(process.env.SWAGGER_TITLE || 'API')
      .setDescription(process.env.SWAGGER_DESCRIPTION || 'API documentation')
      .setVersion(process.env.SWAGGER_VERSION || '1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(swaggerPath, app, document);
  }

  await app.listen(port);
  console.log(`🚀 Server: http://localhost:${port}/api`);
  console.log(`🚀 Running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📚 Swagger: http://localhost:${port}/${swaggerPath}`);
}

bootstrap();
