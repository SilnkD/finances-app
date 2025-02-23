import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { ValidationPipeCustom } from './common/pipes/validation.pipe';

async function start() {
  dotenv.config();
  const PORT = process.env.PORT || 5000;
  const app = await NestFactory.create(AppModule);
  
  const config = new DocumentBuilder()
    .setTitle('Трекер финансов')
    .setDescription('Приложение для личных финансовых целей')
    .setVersion('1.0.0')
    .addTag('Silenok')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/docs', app, document);
  app.useGlobalPipes(new ValidationPipeCustom()); //обработка dto
  await app.listen(PORT, () => console.log(`Server started on port ${PORT}`))
}
start();