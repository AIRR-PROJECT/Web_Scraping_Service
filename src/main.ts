import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Web-Scraping Document")
    .setDescription("API Documentation")
    .setVersion('1.0')
    .build();

  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('documents',app, swaggerDoc);

  await app.listen(process.env.PORT ?? 3000);
  console.log("App running on port 3000");
}
bootstrap();
