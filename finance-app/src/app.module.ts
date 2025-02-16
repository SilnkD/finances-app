import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'root',
      password: '159915',
      database: 'Finances',
      models: [],
      autoLoadModels: true, //создание таблиц на основании моделей
    }),
  ],
  controllers: [],
  providers: [], //логика для использования контролерами
})
export class AppModule {}
