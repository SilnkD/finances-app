import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';

async function start() {
  dotenv.config();
  const PORT = process.env.PORT || 5000;
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  
  const config = new DocumentBuilder()
    .setTitle('Трекер финансов')
    .setDescription('Приложение для личных финансовых целей')
    .setVersion('1.0.0')
    .addTag('Silenok')
    .build()
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/docs', app, document);
  await app.listen(PORT, () => console.log(`Server started on port ${PORT}`))
}
start();