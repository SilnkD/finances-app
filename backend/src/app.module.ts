import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { User } from './database/models/users.model';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { Category } from './database/models/categories.model';
import { UserCategory } from './database/models/user-categories.model';
import { Goal } from './database/models/goals.model';
import { Budget } from './database/models/budget.model';
import { Transaction } from './database/models/transaction.model';
import { TransactionsModule } from './transactions/transactions.module';
import * as process from 'process'; // Import process for environment variable access

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.development.env`, 
      isGlobal: true, 
    }),
    SequelizeModule.forRootAsync({
      useFactory: () => ({
        dialect: process.env.NODE_ENV === 'test' ? 'sqlite' : 'postgres', // Use SQLite for tests
        ...(process.env.NODE_ENV === 'test' && {
          storage: ':memory:', // Use in-memory storage for SQLite
          logging: false, // Disable logging for tests
        }),
        ...(process.env.NODE_ENV !== 'test' && {
          host: process.env.POSTGRES_HOST,
          port: Number(process.env.POSTGRES_PORT),
          username: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DB,
        }),
        models: [User, Category, UserCategory, Goal, Budget, Transaction],
        autoLoadModels: true,
      }),
    }),
    AuthModule,
    CategoriesModule,
    TransactionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}