import { Test, TestingModule } from '@nestjs/testing';
import { GoalsService } from './goals.service';
import { Goal } from '../database/models/goals.model';
import { Budget } from 'src/database/models/budget.model';
import { Category } from '../database/models/categories.model';
import { CreateGoalDto } from './dto/create-goal-dto';
import { GetGoalDto } from './dto/get-goal-dto';
import { getModelToken } from '@nestjs/sequelize';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('GoalsService', () => {
  let goalsService: GoalsService;
  let mockGoalRepository;
  let mockBudgetRepository;
  let mockCategoryRepository;

  beforeEach(async () => {
    mockGoalRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    };

    mockBudgetRepository = {
      findOne: jest.fn(),
    };

    mockCategoryRepository = {
      findByPk: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: getModelToken(Goal), useValue: mockGoalRepository },
        { provide: getModelToken(Budget), useValue: mockBudgetRepository },
        { provide: getModelToken(Category), useValue: mockCategoryRepository },
      ],
    }).compile();

    goalsService = module.get<GoalsService>(GoalsService);
  });

  it('should create a goal', async () => {
    const dto: CreateGoalDto = {
      name: 'Поездка на море',
      target_amount: 1000,
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      budget_id: 1,
    };
    const userId = 1;
    const mockBudget = { id: 1 };
    const mockGoal = { id: 1, ...dto, user_id: userId, save: jest.fn().mockResolvedValue(true) }; // Замокать save
  
    mockBudgetRepository.findOne.mockResolvedValue(mockBudget);
    mockGoalRepository.create.mockResolvedValue(mockGoal);
  
    const result = await goalsService.createGoal(dto, userId);
  
    expect(mockBudgetRepository.findOne).toHaveBeenCalledWith({ where: { id: dto.budget_id } });
    expect(mockGoalRepository.create).toHaveBeenCalledWith({ ...dto, user_id: userId });
    expect(mockGoal.save).toHaveBeenCalled(); // Проверяем вызов save
    expect(result).toEqual(mockGoal);
  });  

  it('should throw an error if budget is not found when creating a goal', async () => {
    const dto: CreateGoalDto = {
      name: 'Поездка на море',
      target_amount: 1000,
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      budget_id: 999,
    };
    const userId = 1;

    mockBudgetRepository.findOne.mockResolvedValue(null);

    await expect(goalsService.createGoal(dto, userId)).rejects.toThrow(
      new HttpException('Счет не найден', HttpStatus.NOT_FOUND),
    );

    expect(mockBudgetRepository.findOne).toHaveBeenCalledWith({ where: { id: dto.budget_id } });
    expect(mockGoalRepository.create).not.toHaveBeenCalled();
  });

  it('should get all goals and map them to GetGoalDto format', async () => {
    const goals = [
      {
        id: 1,
        user_id: 1,
        name: 'Поездка на море',
        target_amount: 1000,
        current_amount: 500,
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        budget: { usercategory: { category_id: 1 } }, // Убедитесь, что данные корректны
      },
    ];
    const category = { id: 1, name: 'Категория' };
  
    mockGoalRepository.findAll.mockResolvedValue(goals);
    mockCategoryRepository.findByPk.mockResolvedValue(category);
  
    const result = await goalsService.getGoals();
  
    expect(mockGoalRepository.findAll).toHaveBeenCalled();
    expect(mockCategoryRepository.findByPk).toHaveBeenCalledWith(goals[0].budget.usercategory.category_id);
    expect(result).toEqual([
      {
        id: goals[0].id,
        category_name: category.name,
        user_id: goals[0].user_id,
        name: goals[0].name,
        target_amount: goals[0].target_amount,
        current_amount: goals[0].current_amount,
        start_date: goals[0].start_date,
        end_date: goals[0].end_date,
      },
    ]);
  });

  it('should delete a goal', async () => {
    const userId = 1;
    const goalId = 1;
    const goal = { id: goalId, user_id: userId };

    mockGoalRepository.findOne.mockResolvedValue(goal);
    mockGoalRepository.destroy.mockResolvedValue(1);

    const result = await goalsService.deleteGoal(userId, goalId);

    expect(mockGoalRepository.findOne).toHaveBeenCalledWith({ where: { id: goalId } });
    expect(mockGoalRepository.destroy).toHaveBeenCalledWith({ where: { id: goalId } });
    expect(result).toBe(`Цель с id ${goalId} удалена.`);
  });

  it('should throw an error if goal is not found when deleting', async () => {
    const userId = 1;
    const goalId = 999;

    mockGoalRepository.findOne.mockResolvedValue(null);

    await expect(goalsService.deleteGoal(userId, goalId)).rejects.toThrow(
      new HttpException('Цель не найдена', HttpStatus.NOT_FOUND),
    );

    expect(mockGoalRepository.findOne).toHaveBeenCalledWith({ where: { id: goalId } });
    expect(mockGoalRepository.destroy).not.toHaveBeenCalled();
  });
});