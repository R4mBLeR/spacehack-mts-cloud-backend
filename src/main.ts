import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 5050;

  // Swagger конфігурація
  const swaggerConfig = new DocumentBuilder()
    .setTitle(process.env.SWAGGER_TITLE || 'MTS Spacehack Backend API')
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
  SwaggerModule.setup(process.env.SWAGGER_PATH || 'swagger', app, document);

  await app.listen(port);
  console.log(`🚀 Server: http://localhost:${port}`);
  console.log(
    `📚 Swagger: http://localhost:${port}/${process.env.SWAGGER_PATH || 'swagger'}`,
  );
}

bootstrap();
