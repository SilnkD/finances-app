import { Body, Controller, Post, UseGuards, Request, Get, Param, Delete } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction-dto';
import { Transaction } from 'src/database/models/transaction.model';
import { IdGuard } from 'src/common/guards/auth.guard';

@ApiTags('Транзакции')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @ApiOperation({ summary: 'Создание транзакции' })
  @ApiResponse({ status: 200, description: 'Транзакция успешно создана', type: Transaction })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Post()
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto, @Request() req) {
    return this.transactionsService.createTransaction(createTransactionDto);
  }

  @ApiOperation({ summary: 'Получение транзакций по счету' })
  @ApiResponse({ status: 200, description: 'Транзакции успешно получены', type: [Transaction] })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Get(':budget_id')
  async getTransactionsByBudget(@Param('budget_id') budget_id: number) {
    return this.transactionsService.getTransactionsByBudget(budget_id);
  }

  @ApiOperation({ summary: 'Удаление транзакции' })
  @ApiResponse({ status: 200, description: 'Транзакция успешно удалена' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 404, description: 'Транзакция не найдена' })
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Delete(':id')
  async deleteTransaction(@Param('id') id: number) {
    return this.transactionsService.deleteTransaction(id);
  }
}