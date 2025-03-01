import { Module, OnModuleInit } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { User } from './database/models/users.model';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { Category } from './database/models/categories.model';
import { GoalsModule } from './goals/goals.module';
import { UserCategory } from './database/models/user-categories.model';
import { Goal } from './database/models/goals.model';
import { BudgetModule } from './budget/budget.module';
import { Budget } from './database/models/budget.model';
import { Transaction } from './database/models/transaction.model';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.development.env`, 
      isGlobal: true, 
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      models: [User, Category, UserCategory, Goal, Budget, Transaction],
      autoLoadModels: true,
    }),
    UsersModule,
    AuthModule,
    CategoriesModule,
    GoalsModule,
    BudgetModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}