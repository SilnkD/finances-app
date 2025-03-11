import { Test, TestingModule } from '@nestjs/testing';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service'; 
import { CreateBudgetDto } from './dto/create-budget-dto';
import { IdGuard } from 'src/common/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Role } from 'src/common/enums/roles.enum';

describe('BudgetController', () => {
  let budgetController: BudgetController;
  let budgetService: BudgetService;

  const mockBudgetService = {
    createBudget: jest.fn(),
    getUserBudgets: jest.fn(),
    updateBudgetAmount: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn().mockReturnValue({ id: 1, role: Role.Admin }), // Замоканный метод верификации JWT
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetController],
      providers: [
        { provide: BudgetService, useValue: mockBudgetService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: Reflector, useValue: { get: jest.fn() } },
        IdGuard,
      ],
    }).compile();

    budgetController = module.get<BudgetController>(BudgetController);
    budgetService = module.get<BudgetService>(BudgetService);
  });

  it('should create a budget', async () => {
    const dto: CreateBudgetDto = {
      amount: 100,
      category_id: 1,
    };
    const req = { user: { id: 1, role: Role.Admin } };
    mockBudgetService.createBudget.mockResolvedValue({
      id: 1,
      name: 'Test Budget',
    });

    const result = await budgetController.createBudget(dto, req);

    expect(budgetService.createBudget).toHaveBeenCalledWith(dto, 1);
    expect(result).toEqual({ id: 1, name: 'Test Budget' });
  });

  it('should throw error when creating a budget with invalid data', async () => {
    const dto: CreateBudgetDto = {
      amount: 100,
      category_id: 1,
    };
    const req = { user: { id: 1, role: Role.Admin } };
    mockBudgetService.createBudget.mockRejectedValue(
      new HttpException('Invalid data', HttpStatus.BAD_REQUEST),
    );

    await expect(budgetController.createBudget(dto, req)).rejects.toThrow(
      'Invalid data',
    );
  });

  it('should return user budgets', async () => {
    const req = { user: { id: 1 } };
    mockBudgetService.getUserBudgets.mockResolvedValue({
      id: 1,
      name: 'Test Budget',
    });

    const result = await budgetController.getUserBudgets(req);

    expect(mockBudgetService.getUserBudgets).toHaveBeenCalledWith(1);
    expect(result).toEqual({ id: 1, name: 'Test Budget' });
  });

  it('should update a budget', async () => {
    const dto: CreateBudgetDto = {
      amount: 100,
      category_id: 1,
    };
    const req = { user: { id: 1, role: Role.Admin } };
    mockBudgetService.updateBudgetAmount.mockResolvedValue({
      id: 1,
      name: 'Updated Budget',
    });

    const result = await budgetController.updateBudgetAmount(dto, req);

    expect(budgetService.updateBudgetAmount).toHaveBeenCalledWith(dto, 1);
    expect(result).toEqual({ id: 1, name: 'Updated Budget' });
  });

  it('should throw error when updating non-existent budget', async () => {
    const dto: CreateBudgetDto = {
      amount: 0,
      category_id: 999,
    };
    const req = { user: { id: 1, role: Role.Admin } };
    mockBudgetService.updateBudgetAmount.mockRejectedValue(
      new HttpException('Счет не найден', HttpStatus.NOT_FOUND),
    );

    await expect(
      budgetController.updateBudgetAmount(dto, req),
    ).rejects.toThrow('Счет не найден');
  });
  
});