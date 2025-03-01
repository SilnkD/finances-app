import { forwardRef, Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { BudgetModule } from 'src/budget/budget.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { Transaction } from 'src/database/models/transaction.model';
import { Budget } from 'src/database/models/budget.model';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [TransactionsService],
  controllers: [TransactionsController], 
  imports: [
      SequelizeModule.forFeature([Transaction, Budget]),
      forwardRef(()=>BudgetModule),
      AuthModule,
    ]
})
export class TransactionsModule {}
