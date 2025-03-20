import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { Transaction } from 'src/database/models/transaction.model';
import { Budget } from 'src/database/models/budget.model';
import { BudgetService } from 'src/budget/budget.service';
import { getModelToken } from '@nestjs/sequelize';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('TransactionsService', () => {
  let transactionsService: TransactionsService;
  let mockTransactionRepository;
  let mockBudgetRepository;
  let mockBudgetService;

  beforeEach(async () => {
    mockTransactionRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      destroy: jest.fn(),
    };

    mockBudgetRepository = {
      findOne: jest.fn(),
    };

    mockBudgetService = {
      updateBudgetAmount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: getModelToken(Transaction), useValue: mockTransactionRepository },
        { provide: getModelToken(Budget), useValue: mockBudgetRepository },
        { provide: BudgetService, useValue: mockBudgetService },
      ],
    }).compile();

    transactionsService = module.get<TransactionsService>(TransactionsService);
  });

  describe('createTransaction', () => {
    it('should successfully create a transaction', async () => {
      const dto = { budget_id: 1, amount: 100, date: new Date().toISOString(), description: 'Test Transaction' };
      const mockBudget = { id: 1 };
      const mockTransaction = { id: 1, ...dto };

      mockBudgetRepository.findOne.mockResolvedValue(mockBudget);
      mockTransactionRepository.create.mockResolvedValue(mockTransaction);

      const result = await transactionsService.createTransaction(dto, 1);

      expect(mockBudgetRepository.findOne).toHaveBeenCalledWith({ where: { id: dto.budget_id } });
      expect(mockBudgetService.updateBudgetAmount).toHaveBeenCalledWith({ category_id: mockBudget.id, amount: dto.amount }, 1);
      expect(mockTransactionRepository.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTransaction);
    });

    it('should throw an error if budget is not found', async () => {
      const dto = { budget_id: 999, amount: 100, date: new Date().toISOString(), description: 'Test Transaction' };

      mockBudgetRepository.findOne.mockResolvedValue(null);

      await expect(transactionsService.createTransaction(dto, 1)).rejects.toThrow(
        new HttpException('Счет не найден', HttpStatus.NOT_FOUND),
      );

      expect(mockBudgetRepository.findOne).toHaveBeenCalledWith({ where: { id: dto.budget_id } });
      expect(mockBudgetService.updateBudgetAmount).not.toHaveBeenCalled();
      expect(mockTransactionRepository.create).not.toHaveBeenCalled();
    });

    it('should throw an error if budgetService.updateBudgetAmount fails', async () => {
      const dto = { budget_id: 1, amount: 100, date: new Date().toISOString(), description: 'Test Transaction' };
      const mockBudget = { id: 1 };

      mockBudgetRepository.findOne.mockResolvedValue(mockBudget);
      mockBudgetService.updateBudgetAmount.mockRejectedValue(new Error('Budget update failed'));

      await expect(transactionsService.createTransaction(dto, 1)).rejects.toThrow('Budget update failed');

      expect(mockBudgetRepository.findOne).toHaveBeenCalledWith({ where: { id: dto.budget_id } });
      expect(mockBudgetService.updateBudgetAmount).toHaveBeenCalledWith({ category_id: mockBudget.id, amount: dto.amount }, 1);
      expect(mockTransactionRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getTransactionsByBudget', () => {
    it('should return transactions for a given budget ID', async () => {
      const budget_id = 1;
      const mockTransactions = [
        { id: 1, budget_id, amount: 100, date: new Date().toISOString(), description: 'Test Transaction' },
      ];

      mockTransactionRepository.findAll.mockResolvedValue(mockTransactions);

      const result = await transactionsService.getTransactionsByBudget(budget_id);

      expect(mockTransactionRepository.findAll).toHaveBeenCalledWith({
        where: { budget_id },
        include: { all: true },
      });
      expect(result).toEqual(mockTransactions);
    });

    it('should return an empty array if no transactions are found', async () => {
      const budget_id = 999;

      mockTransactionRepository.findAll.mockResolvedValue([]);

      const result = await transactionsService.getTransactionsByBudget(budget_id);

      expect(mockTransactionRepository.findAll).toHaveBeenCalledWith({
        where: { budget_id },
        include: { all: true },
      });
      expect(result).toEqual([]);
    });
  });

  describe('deleteTransaction', () => {
    it('should successfully delete a transaction', async () => {
      const transactionId = 1;
      const mockTransaction = { id: 1 };

      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
      mockTransactionRepository.destroy.mockResolvedValue(1);

      const result = await transactionsService.deleteTransaction(transactionId);

      expect(mockTransactionRepository.findOne).toHaveBeenCalledWith({ where: { id: transactionId } });
      expect(mockTransactionRepository.destroy).toHaveBeenCalledWith({ where: { id: transactionId } });
      expect(result).toBe(`Транзакция с id ${transactionId} удалена.`);
    });

    it('should throw an error if transaction is not found', async () => {
      const transactionId = 999;

      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(transactionsService.deleteTransaction(transactionId)).rejects.toThrow(
        new HttpException('Транзакция не найдена', HttpStatus.NOT_FOUND),
      );

      expect(mockTransactionRepository.findOne).toHaveBeenCalledWith({ where: { id: transactionId } });
      expect(mockTransactionRepository.destroy).not.toHaveBeenCalled();
    });

    it('should throw an error if transactionRepository.destroy fails', async () => {
      const transactionId = 1;
      const mockTransaction = { id: 1 };

      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
      mockTransactionRepository.destroy.mockRejectedValue(new Error('Deletion failed'));

      await expect(transactionsService.deleteTransaction(transactionId)).rejects.toThrow('Deletion failed');

      expect(mockTransactionRepository.findOne).toHaveBeenCalledWith({ where: { id: transactionId } });
      expect(mockTransactionRepository.destroy).toHaveBeenCalledWith({ where: { id: transactionId } });
    });
  });
});