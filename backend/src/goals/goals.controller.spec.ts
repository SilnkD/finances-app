import { Test, TestingModule } from '@nestjs/testing';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal-dto';
import { IdGuard } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Role } from 'src/common/enums/roles.enum';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

describe('GoalsController', () => {
  let goalsController: GoalsController;
  let goalsService: GoalsService;

  const mockGoalsService = {
    createGoal: jest.fn(),
    getGoals: jest.fn(),
    getUserGoals: jest.fn(),
    deleteGoal: jest.fn(),
    updateGoal: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn().mockReturnValue({ id: 1, role: Role.Admin }), // Замоканный метод верификации JWT
  };
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoalsController],
      providers: [
        { provide: GoalsService, useValue: mockGoalsService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: Reflector, useValue: { get: jest.fn() } },
        IdGuard,
        RolesGuard,
      ],
    }).compile();

    goalsController = module.get<GoalsController>(GoalsController);
    goalsService = module.get<GoalsService>(GoalsService);
  });

  it('should create a goal', async () => {
    const req = { user: { id: 1 } };
    const dto: CreateGoalDto = { 
      name: 'Test Goal', 
      target_amount: 100.00, 
      start_date: 'date',
      end_date: 'date',
      budget_id: 1,
    };
    mockGoalsService.createGoal.mockResolvedValue({ id: 1, ...dto });

    const result = await goalsController.createGoal(dto, req);

    expect(goalsService.createGoal).toHaveBeenCalledWith(dto, 1);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should throw an error when creating goal with invalid data', async () => {
    const req = { user: { id: 1 } };
    const dto: CreateGoalDto = { 
      name: '', 
      target_amount: 0.00, 
      start_date: '',
      end_date: '',
      budget_id: 999,
    };
    mockGoalsService.createGoal.mockRejectedValue(
      new HttpException('Invalid data', HttpStatus.BAD_REQUEST),
    );

    await expect(goalsController.createGoal(dto, req)).rejects.toThrow('Invalid data');
  });

  it('should return all goals', async () => {
    mockGoalsService.getGoals.mockResolvedValue([{ id: 1, title: 'Test Goal' }]);

    const result = await goalsController.getGoals();

    expect(goalsService.getGoals).toHaveBeenCalled();
    expect(result).toEqual([{ id: 1, title: 'Test Goal' }]);
  });

  it('should return user-specific goals', async () => {
    const req = { user: { id: 1 } };
    mockGoalsService.getUserGoals.mockResolvedValue([{ id: 1, title: 'User Goal' }]);

    const result = await goalsController.getUserGoals(req);

    expect(goalsService.getUserGoals).toHaveBeenCalledWith(1);
    expect(result).toEqual([{ id: 1, title: 'User Goal' }]);
  });

  it('should delete a goal', async () => {
    const req = { user: { id: 1 } };
    mockGoalsService.deleteGoal.mockResolvedValue('Goal with id 1 deleted.');

    const result = await goalsController.deleteGoal(req, 1);

    expect(goalsService.deleteGoal).toHaveBeenCalledWith(1, 1);
    expect(result).toBe('Goal with id 1 deleted.');
  });

  it('should throw an error when deleting a non-existent goal', async () => {
    const req = { user: { id: 1 } };
    mockGoalsService.deleteGoal.mockRejectedValue(
      new HttpException('Goal not found', HttpStatus.NOT_FOUND),
    );

    await expect(goalsController.deleteGoal(req, 999)).rejects.toThrow('Goal not found');
  });

  it('should update a goal', async () => {
    const req = { user: { id: 1 } };
    const dto: CreateGoalDto = { 
      name: 'Test Goal', 
      target_amount: 100.00, 
      start_date: 'date',
      end_date: 'date',
      budget_id: 1,
    };
    mockGoalsService.updateGoal.mockResolvedValue({ id: 1, ...dto });

    const result = await goalsController.updateGoal(dto, req, 1);

    expect(goalsService.updateGoal).toHaveBeenCalledWith(1, dto, 1);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should throw an error when updating a non-existent goal', async () => {
    const req = { user: { id: 1 } };
    const dto: CreateGoalDto = { 
      name: '', 
      target_amount: 0.00, 
      start_date: '',
      end_date: '',
      budget_id: 999,
    };
    mockGoalsService.updateGoal.mockRejectedValue(
      new HttpException('Goal not found', HttpStatus.NOT_FOUND),
    );

    await expect(goalsController.updateGoal(dto, req, 999)).rejects.toThrow('Goal not found');
  });
});