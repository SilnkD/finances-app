import { forwardRef, Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Category } from '../database/models/categories.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from 'src/database/models/users.model';
import { AuthModule } from 'src/auth/auth.module';
import { UserCategory } from 'src/database/models/user-categories.model';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
  imports: [
      SequelizeModule.forFeature([Category, User, UserCategory]),
      forwardRef(() => AuthModule),
  ],
})
export class CategoriesModule {}