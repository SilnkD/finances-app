import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'src/database/models/transaction.model';
import { CreateTransactionDto } from './dto/create-transaction-dto';
import { Budget } from 'src/database/models/budget.model';
import { BudgetService } from 'src/budget/budget.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction) private transactionRepository: typeof Transaction,
    @InjectModel(Budget) private budgetRepository: typeof Budget,
    private budgetServise: BudgetService
  ) {}

  async createTransaction(dto: CreateTransactionDto) {
    const budget = await this.budgetRepository.findOne({ where: { id: dto.budget_id } });
    if (!budget) {
      throw new HttpException('Счет не найден', HttpStatus.NOT_FOUND);
    }
    await this.budgetServise.updateBudgetAmount(budget.id, dto.amount);
    const transaction = await this.transactionRepository.create(dto);
    return transaction;
  }

  async getTransactionsByBudget(budget_id: number) {
    const transactions = await this.transactionRepository.findAll({ where: { budget_id }, include: {all:true} },);
    return transactions;
  }

  async deleteTransaction(id: number) {
    const transaction = await this.transactionRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new HttpException('Транзакция не найдена', HttpStatus.NOT_FOUND);
    }

    await this.transactionRepository.destroy({ where: { id } });
    return `Транзакция с id ${id} удалена.`;
  }
}