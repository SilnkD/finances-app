import { Module } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Goal } from '../database/models/goals.model';
import { User } from 'src/database/models/users.model';
import { Category } from 'src/database/models/categories.model';
import { AuthModule } from 'src/auth/auth.module';
import { Budget } from 'src/database/models/budget.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Goal, User, Category, Budget]),
    AuthModule,
  ],
  controllers: [GoalsController],
  providers: [GoalsService],
})
export class GoalsModule {}