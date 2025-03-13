import { Test, TestingModule } from '@nestjs/testing';
import { GoalsService } from './goals.service';
import { Goal } from '../database/models/goals.model';
import { Budget } from 'src/database/models/budget.model';
import { Category } from '../database/models/categories.model';
import { CreateGoalDto } from './dto/create-goal-dto';
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
    const createDto: CreateGoalDto = { name: 'Goal 1', budget_id: 1, target_amount: 1000, start_date: new Date().toISOString(), end_date: new Date().toISOString() };

    mockBudgetRepository.findOne.mockResolvedValue(null);

    await expect(goalsService.createGoal(createDto, 1)).rejects.toThrow(
        new HttpException('Счет не найден', HttpStatus.NOT_FOUND)
    );
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
    const mockGoals = [
        {
            id: 1,
            user_id: 1,
            name: 'Goal 1',
            target_amount: 1000,
            start_date: new Date().toISOString(),
            end_date: new Date().toISOString(),
            budget: {
                usercategory: {
                    category: { name: 'Test Category' }
                }
            }
        }
    ];

    mockGoalRepository.findAll.mockResolvedValue(mockGoals); // Возврат целей
    jest.spyOn(goalsService, 'displayGoal').mockResolvedValue([
        {
            id: 1,
            category_name: 'Test Category',
            user_id: 1,
            name: 'Goal 1',
            target_amount: 1000,
            start_date: mockGoals[0].start_date,
            end_date: mockGoals[0].end_date,
        }
    ]);

    const result = await goalsService.getGoals();

    expect(result).toEqual([
        {
            id: 1,
            category_name: 'Test Category',
            user_id: 1,
            name: 'Goal 1',
            target_amount: 1000,
            start_date: mockGoals[0].start_date,
            end_date: mockGoals[0].end_date,
        }
    ]);
    expect(mockGoalRepository.findAll).toHaveBeenCalled();
    expect(goalsService.displayGoal).toHaveBeenCalledWith(mockGoals);
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

  it('should throw an error if goal is not assigned to current user', async () => {
    const userId = 999; 
    const goalId = 1; 

    const mockGoal = {
        id: goalId,
        user_id: 1, 
        name: 'Goal 1',
    };

    mockGoalRepository.findOne.mockResolvedValue(mockGoal); 
    await expect(goalsService.deleteGoal(userId, goalId)).rejects.toThrow(
        new HttpException('Вы не можете удалить чужую цель', HttpStatus.FORBIDDEN),
    );

    expect(mockGoalRepository.findOne).toHaveBeenCalledWith({ where: { id: goalId } });
    expect(mockGoalRepository.destroy).not.toHaveBeenCalled();
});

  it('should update a goal successfully and return updated goal', async () => {
    const updateDto: CreateGoalDto = { name: 'Updated Goal', budget_id: 1, target_amount: 2000, start_date: new Date().toISOString(), end_date: new Date().toISOString() };

    const mockGoal = { id: 1, user_id: 1, name: 'Goal 1', budget_id: 1 };
    const mockBudget = { id: 1 };
    const mockUpdatedGoal = {
        id: 1,
        user_id: 1,
        name: 'Updated Goal',
        target_amount: 2000,
        start_date: updateDto.start_date,
        end_date: updateDto.end_date,
        budget: {
            usercategory: {
                category: { name: 'Test Category' }
            }
        }
    };

    mockGoalRepository.findOne.mockResolvedValueOnce(mockGoal); // Цель найдена
    mockBudgetRepository.findOne.mockResolvedValue(mockBudget); // Счет найден
    mockGoalRepository.findOne.mockResolvedValueOnce(mockUpdatedGoal); // Возврат обновленной цели
    mockGoalRepository.update.mockResolvedValue([1]); // Успешное обновление

    const result = await goalsService.updateGoal(1, updateDto, 1);

    expect(result).toEqual({
        id: 1,
        category_name: 'Test Category',
        user_id: 1,
        name: 'Updated Goal',
        target_amount: 2000,
        start_date: updateDto.start_date,
        end_date: updateDto.end_date,
    });
    expect(mockGoalRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(mockBudgetRepository.findOne).toHaveBeenCalledWith({ where: { id: updateDto.budget_id } });
    expect(mockGoalRepository.update).toHaveBeenCalledWith(updateDto, { where: { id: 1 } });
});

});