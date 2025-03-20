import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction-dto';
import { IdGuard } from 'src/common/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('TransactionsController', () => {
  let transactionsController: TransactionsController;
  let transactionsService: TransactionsService;

  const mockTransactionsService = {
    createTransaction: jest.fn(),
    getTransactionsByBudget: jest.fn(),
    deleteTransaction: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn().mockReturnValue({ id: 1, role: 'Admin' }), // Замоканный метод верификации JWT
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        { provide: TransactionsService, useValue: mockTransactionsService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: Reflector, useValue: { get: jest.fn() } },
        IdGuard,
      ],
    }).compile();

    transactionsController = module.get<TransactionsController>(TransactionsController);
    transactionsService = module.get<TransactionsService>(TransactionsService);
  });

  it('should create a transaction', async () => {
    const req = { user: { id: 1 } };
    const dto: CreateTransactionDto = {
      budget_id: 1,
      amount: 1000,
      date: new Date().toISOString(),
      description: 'Test transaction',
    };
    mockTransactionsService.createTransaction.mockResolvedValue({
      id: 1,
      ...dto,
    });

    const result = await transactionsController.createTransaction(dto, req);

    expect(transactionsService.createTransaction).toHaveBeenCalledWith(dto, req.user.id);
    expect(result).toEqual({
      id: 1,
      ...dto,
    });
  });

  it('should throw an error for invalid transaction data', async () => {
    const req = { user: { id: 1 } };
    const dto: CreateTransactionDto = {
      budget_id: 999, // Некорректные данные
      amount: NaN,
      date: '',
      description: '',
    };
    mockTransactionsService.createTransaction.mockRejectedValue(
      new HttpException('Invalid data', HttpStatus.BAD_REQUEST),
    );

    await expect(transactionsController.createTransaction(dto, req)).rejects.toThrow(
      'Invalid data',
    );
  });

  it('should return transactions by budget ID', async () => {
    const budget_id = 1;
    const currentDate = new Date();
    mockTransactionsService.getTransactionsByBudget.mockResolvedValue([
      { id: 1, budget_id, amount: 500, date: currentDate, description: 'Test transaction' },
    ]);

    const result = await transactionsController.getTransactionsByBudget(budget_id);

    expect(transactionsService.getTransactionsByBudget).toHaveBeenCalledWith(budget_id);
    expect(result).toEqual([
      { id: 1, budget_id, amount: 500, date: currentDate, description: 'Test transaction' },
    ]);
  });

  it('should throw an error when budget transactions not found', async () => {
    const budget_id = 999;
    mockTransactionsService.getTransactionsByBudget.mockRejectedValue(
      new HttpException('Transactions not found', HttpStatus.NOT_FOUND),
    );

    await expect(
      transactionsController.getTransactionsByBudget(budget_id),
    ).rejects.toThrow('Transactions not found');
  });

  it('should delete a transaction', async () => {
    const transactionId = 1;
    mockTransactionsService.deleteTransaction.mockResolvedValue('Transaction deleted successfully');

    const result = await transactionsController.deleteTransaction(transactionId);

    expect(transactionsService.deleteTransaction).toHaveBeenCalledWith(transactionId);
    expect(result).toBe('Transaction deleted successfully');
  });

  it('should throw an error when deleting a non-existent transaction', async () => {
    const transactionId = 999;
    mockTransactionsService.deleteTransaction.mockRejectedValue(
      new HttpException('Transaction not found', HttpStatus.NOT_FOUND),
    );

    await expect(transactionsController.deleteTransaction(transactionId)).rejects.toThrow(
      'Transaction not found',
    );
  });
});