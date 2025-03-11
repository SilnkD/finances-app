import { Test, TestingModule } from '@nestjs/testing';
import { BudgetService } from './budget.service';
import { Budget } from 'src/database/models/budget.model';
import { Category } from 'src/database/models/categories.model';
import { UserCategory } from 'src/database/models/user-categories.model';
import { getModelToken } from '@nestjs/sequelize';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget-dto';
import { Model } from 'sequelize';

describe('BudgetService', () => {
  let service: BudgetService;
  let budgetRepository: jest.Mocked<typeof Budget>;
  let categoryRepository: jest.Mocked<typeof Category>;
  let userCategoryRepository: jest.Mocked<typeof UserCategory>;

  beforeEach(async () => {
    budgetRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    } as any;

    categoryRepository = {
      findByPk: jest.fn(),
      findOne: jest.fn(),
    } as any;

    userCategoryRepository = {
      findByPk: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        {
          provide: getModelToken(Budget),
          useValue: budgetRepository,
        },
        {
          provide: getModelToken(Category),
          useValue: categoryRepository,
        },
        {
          provide: getModelToken(UserCategory),
          useValue: userCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<BudgetService>(BudgetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  
  const mockCategory: Category = {
    id: 1,
    name: 'Test Category',
    save: jest.fn().mockResolvedValue(true),
  } as unknown as Category;

  const mockCategory2: Category = {
    id: 2,
    name: 'Test Category',
    save: jest.fn().mockResolvedValue(true),
  } as unknown as Category;

  const mockBudget: Budget = {
    id: 1,
    user_id: 1,
    category_id: 1,
    amount: 1000,
    save: jest.fn().mockResolvedValue(true),
  } as unknown as Budget;

  const mockBudget2: Budget = {
    id: 2,
    user_id: 1,
    category_id: 2,
    amount: 2000,
    save: jest.fn().mockResolvedValue(true),
  } as unknown as Budget;

  const mockUserCategory: UserCategory = {
    id: 1,
    user_id: 1,
    category_id: 1,
    percentage: 10,
    budget: mockBudget,
  } as unknown as UserCategory;
  
  const mockUserCategory2: UserCategory = {
    id: 2,
    user_id: 1,
    category_id: 2,
    percentage: 10,
    budget: mockBudget2,
  } as unknown as UserCategory;  
  
  const mockCategory3: any = { id: 3, name: 'Test Category' } as unknown as UserCategory;  
  const mockUserCategory3: any = { id: 3, user_id: 1, category_id: 3, percentage: 10 } as unknown as UserCategory;   

  const mockUserCategories = [mockUserCategory, mockUserCategory2, mockUserCategory3];
  const mockCategories = [mockCategory, mockCategory2, mockCategory3];
  
  describe('createBudget', () => {

    it('should create a budget and return it', async () => {
      const createBudgetDto: CreateBudgetDto = {
          category_id: 3,
          amount: 3000,
      };
  
      const mockBudget3: any = {
          id: 3,
          user_id: 1,
          category_id: 3,
          amount: 3000,
      };
  
      categoryRepository.findOne.mockResolvedValue(mockCategory3);
      userCategoryRepository.findOne.mockResolvedValue(mockUserCategory3);
      budgetRepository.create.mockResolvedValue(mockBudget3);
      budgetRepository.findOne.mockResolvedValue(mockBudget3); 
  
      const result = await service.createBudget(createBudgetDto, 1);
  
      expect(result).toEqual({
          id: 3,
          category_name: mockCategory.name,
          amount: mockBudget.amount,
      });
  
      expect(budgetRepository.create).toHaveBeenCalledWith({ ...createBudgetDto, user_id: 1 });
  });

    it('should throw error if category not found', async () => {
      const dto: CreateBudgetDto = { category_id: 1, amount: 100 };
      const user_id = 1;

      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.createBudget(dto, user_id)).rejects.toThrow(new HttpException('Категория не найдена', HttpStatus.NOT_FOUND));
    });

    it('should throw error if user category not found', async () => {
      const dto: CreateBudgetDto = { category_id: 1, amount: 100 };
      const user_id = 1;

      categoryRepository.findOne.mockResolvedValue(mockCategory);
      userCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.createBudget(dto, user_id)).rejects.toThrow(new HttpException('Пользователь не указал процент трат категории', HttpStatus.NOT_FOUND));
    });
  });

  describe('displayBudget', () => {
    it('should return the displayed budget', async () => {
      userCategoryRepository.findByPk.mockResolvedValue(mockUserCategory);
      categoryRepository.findByPk.mockImplementation((id) => {
        const category = mockCategories.find(cat => cat.id === id);
        return Promise.resolve(category || null);
      });

      const result = await service.displayBudget(mockBudget);

      expect(result).toEqual({
        id: mockBudget.id,
        category_name: mockCategory.name,
        amount: mockBudget.amount,
      });
    });

    it('should throw an error when budget is not found', async () => {
      const mockBudget = { user_id: 1 };

      userCategoryRepository.findByPk.mockResolvedValue(null);
      categoryRepository.findByPk.mockResolvedValue(null);

      await expect(service.displayBudget(mockBudget)).rejects.toThrow(new HttpException('Категория не найдена', HttpStatus.NOT_FOUND));
    });
  });

  describe('getUserBudgets', () => {
    it('should return all user budgets', async () => {
      const user_id = 1;

      userCategoryRepository.findAll.mockResolvedValue(mockUserCategories);
      
      categoryRepository.findByPk.mockImplementation((id) => {
        const category = mockCategories.find(cat => cat.id === id);
        return Promise.resolve(category || null);
      });
      

      const results = await service.getUserBudgets(user_id);

      expect(results.length).toBe(2);
      expect(results).toEqual([
        { id: 1, category_name: 'Test Category', amount: 1000 },
        { id: 2, category_name: 'Test Category', amount: 2000 },
      ]);
    });
  });

  describe('updateBudgetAmount', () => {
    it('should update budget amount and return displayed budget', async () => {
      const budget_id = 1;
      const newAmount = 2000;
      const updatedBudget = { ...mockBudget, amount: newAmount } as unknown as Model<any, any>;

      budgetRepository.update.mockResolvedValue([1]); // Количество обновленных записей   
      budgetRepository.findOne.mockResolvedValue(updatedBudget);    

      const result = await service.updateBudgetAmount(budget_id, newAmount);

      expect(result).toEqual({
        id: mockBudget.id,
        category_name: mockCategory.name,
        amount: newAmount,
      });
      expect(budgetRepository.update).toHaveBeenCalledWith({ amount: newAmount }, { where: { id: budget_id } });
    });
  });

  describe('getBudget', () => {
    it('should return the budget for a user and category', async () => {
      const user_id = 1;
      const category_id = 1;

      userCategoryRepository.findOne.mockResolvedValue(mockUserCategory);
      budgetRepository.findOne.mockResolvedValue(mockBudget);
      categoryRepository.findByPk.mockImplementation((id) => {
        const category = mockCategories.find(cat => cat.id === id);
        return Promise.resolve(category || null);
      });

      const result = await service.getBudget(user_id, category_id);

      expect(result).toEqual({
        id: mockBudget.id,
        category_name: mockCategory.name,
        amount: mockBudget.amount,
      });
      expect(userCategoryRepository.findOne).toHaveBeenCalledWith({ where: { user_id, category_id } });
    });

    it('should throw an error if user category is not found', async () => {
      const user_id = 1;
      const category_id = 1;

      userCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.getBudget(user_id, category_id)).rejects.toThrow(new HttpException('Категория пользователя не найдена', HttpStatus.NOT_FOUND));
    });

    it('should throw an error if budget is not found', async () => {
      const user_id = 1;
      const category_id = 1;

      userCategoryRepository.findOne.mockResolvedValue(mockUserCategory);
      budgetRepository.findOne.mockResolvedValue(null);

      await expect(service.getBudget(user_id, category_id)).rejects.toThrow(new HttpException('Обновленный счет не найден', HttpStatus.NOT_FOUND));
    });
  });
});