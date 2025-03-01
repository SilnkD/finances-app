import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Budget } from 'src/database/models/budget.model';
import { User } from 'src/database/models/users.model';
import { Category } from 'src/database/models/categories.model';
import { AuthModule } from 'src/auth/auth.module';
import { UserCategory } from 'src/database/models/user-categories.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Budget, User, Category, UserCategory]),
    AuthModule,
  ],
  providers: [BudgetService],
  controllers: [BudgetController]
})
export class BudgetModule {}
