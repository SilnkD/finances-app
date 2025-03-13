import { Test, TestingModule } from '@nestjs/testing';
import { BudgetService } from './budget.service';
import { Budget } from 'src/database/models/budget.model';
import { Category } from 'src/database/models/categories.model';
import { UserCategory } from 'src/database/models/user-categories.model';
import { getModelToken } from '@nestjs/sequelize';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget-dto';
import { ExpenseType } from 'src/common/enums/expense-type.enum';
import { AccessType } from 'src/common/enums/access-type.enum';

describe('BudgetService', () => {
  let service: BudgetService;
  let budgetRepository: jest.Mocked<typeof Budget>;
  let categoryRepository: jest.Mocked<typeof Category>;
  let userCategoryRepository: jest.Mocked<typeof UserCategory>;

  beforeEach(async () => {
    budgetRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      findByPk: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(), 
    } as any;

    categoryRepository = {
      create: jest.fn(),
      findByPk: jest.fn(),
      findOne: jest.fn(),
    } as any;

    userCategoryRepository = {
      create: jest.fn(),
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
  
  describe('createBudget', () => {
    
    it('should create a new budget and return it', async () => {
    const createDto: CreateBudgetDto = { category_id: 1, amount: 1000 };

    const mockCategory: any = {
        id: 1,
        name: 'Test Category',
        expense_type: ExpenseType.Expenses,
        access_type: AccessType.Public,
        image_url: 'https://example.com/image.jpg',
    };

    const mockUserCategory: any = {
        id: 1,
        user_id: 1,
        category_id: 1,
        percentage: 20,
    };

    const mockBudget: any = {
        id: 1,
        owner_id: mockUserCategory.id,
        amount: 1000,
        save: jest.fn().mockResolvedValue(true), // Имитируем сохранение
    };

    const mockCreatedBudget = {
        id: 1,
        category_name: 'Test Category',
        amount: 1000,
    };

    // Настройка моков
    categoryRepository.findOne.mockResolvedValue(mockCategory); // Убедиться, что категория найдена
    userCategoryRepository.findOne.mockResolvedValue(mockUserCategory); // Убедиться, что пользовательская категория найдена
    budgetRepository.findOne.mockResolvedValue(null); // Проверка отсутствия существующего бюджета
    budgetRepository.create.mockResolvedValue(mockBudget); // Создать новый бюджет
    jest.spyOn(service, 'displayBudget').mockResolvedValue(mockCreatedBudget); // Эмулировать вызов displayBudget

    // Вызов метода сервиса
    const result = await service.createBudget(createDto, 1);

    // Проверки
    expect(result).toEqual(mockCreatedBudget); // Сравнение с возвращаемым созданным бюджетом
    expect(budgetRepository.findOne).toHaveBeenCalledWith({ where: { owner_id: mockUserCategory.id } }); // Проверка на существующий бюджет
    expect(budgetRepository.create).toHaveBeenCalledWith({
        owner_id: mockUserCategory.id,
        amount: createDto.amount,
    }); // Проверка вызова создания бюджета
    expect(service.displayBudget).toHaveBeenCalledWith(mockBudget); // Проверка вызова displayBudget
    });

    it('should throw error if budget already exists', async () => {
      const createDto: CreateBudgetDto = { category_id: 1, amount: 1000 };
  
      const mockCategory: any = {
          id: 1,
          name: 'Test Category',
      };
  
      const mockUserCategory: any = {
          id: 1,
          user_id: 1,
          category_id: 1,
          percentage: 20,
      };
  
      const mockExistingBudget: any = {
          id: 1,
          owner_id: mockUserCategory.id,
          amount: 1000,
      };
  
      categoryRepository.findOne.mockResolvedValue(mockCategory); // Категория найдена
      userCategoryRepository.findOne.mockResolvedValue(mockUserCategory); // Пользовательская категория найдена
      budgetRepository.findOne.mockResolvedValue(mockExistingBudget); // Бюджет уже существует
  
      await expect(service.createBudget(createDto, 1)).rejects.toThrow(
          new HttpException('Счет для данной категории уже существует', HttpStatus.BAD_REQUEST),
      );
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
      const mockBudget = { id: 1, owner_id: 1, amount: 1000 };
      const mockUserCategory: any = { id: 1, category_id: 1 };
      const mockCategory: any = { id: 1, name: 'Education' };

      userCategoryRepository.findOne.mockResolvedValue(mockUserCategory);
      categoryRepository.findByPk.mockResolvedValue(mockCategory);

      const result = await service.displayBudget(mockBudget);

      expect(result).toEqual({
        id: 1,
        category_name: 'Education',
        amount: 1000,
      });
    });

    it('should throw an error when budget is not found', async () => {
      const mockBudget = { user_id: 1 };

      userCategoryRepository.findByPk.mockResolvedValue(null);
      categoryRepository.findByPk.mockResolvedValue(null);

      await expect(service.displayBudget(mockBudget)).rejects.toThrow(new HttpException('Категория не найдена', HttpStatus.NOT_FOUND));
    });

    it('should throw error if user category not found in displayBudget', async () => {
      const mockBudget = { id: 1, owner_id: 1, amount: 1000 };
      const mockCategory: any = { id: 1, name: 'Education' };

      categoryRepository.findByPk.mockResolvedValue(mockCategory);  
      userCategoryRepository.findOne.mockResolvedValue(null); // Нет пользовательской категории
  
      await expect(service.displayBudget(mockBudget)).rejects.toThrow(
          new HttpException('Категория пользователя не найдена', HttpStatus.NOT_FOUND),
      );
  });
  
  });

  describe('getUserBudgets', () => {
    it('should return all user budgets', async () => {
      const mockUserCategories: any = [
        { id: 1, category_id: 1, budget: { id: 1, amount: 1000 } },
        { id: 2, category_id: 2, budget: { id: 2, amount: 2000 } },
      ];
      const mockCategories: any = [
        { id: 1, name: 'Education' },
        { id: 2, name: 'Health' },
      ];

      userCategoryRepository.findAll.mockResolvedValue(mockUserCategories);
      categoryRepository.findByPk
        .mockResolvedValueOnce(mockCategories[0])
        .mockResolvedValueOnce(mockCategories[1]);

      const result = await service.getUserBudgets(1);

      expect(result).toEqual([
        { id: 1, category_name: 'Education', amount: 1000 },
        { id: 2, category_name: 'Health', amount: 2000 },
      ]);
    });
  });

  describe('updateBudgetAmount', () => {
    it('should update the budget and return the updated budget', async () => {
      const updateDto: CreateBudgetDto = { category_id: 1, amount: 5000 };
  
      const mockCategory: any = {
          id: 1,
          name: 'Test Category',
          expense_type: ExpenseType.Expenses,
          access_type: AccessType.Private,
          image_url: 'https://example.com/image.jpg',
      };
  
      const mockUserCategory: any = {
          id: 1,
          user_id: 1,
          category_id: 1,
          percentage: 10,
      };
  
      const mockBudget: any = {
          id: 1,
          owner_id: mockUserCategory.id,
          amount: 1000,
          save: jest.fn().mockResolvedValue(true), // Имитируем сохранение в базе
      };
  
      const mockUpdatedBudget = {
          id: 1,
          category_name: 'Test Category',
          amount: 5000,
      };
  
      // Настройка моков
      categoryRepository.findOne.mockResolvedValue(mockCategory); // Убедиться, что категория найдена
      userCategoryRepository.findOne.mockResolvedValue(mockUserCategory); // Убедиться, что пользовательская категория найдена
      budgetRepository.findOne.mockResolvedValue(mockBudget); // Найти существующий бюджет
      jest.spyOn(service, 'displayBudget').mockResolvedValue(mockUpdatedBudget); // Эмуляция вызова displayBudget
  
      // Вызов метода сервиса
      const result = await service.updateBudgetAmount(updateDto, 1);
  
      // Проверки
      expect(result).toEqual(mockUpdatedBudget); // Сравнение с возвращаемым обновленным бюджетом
      expect(mockBudget.amount).toBe(5000); // Проверка обновленного значения
      expect(mockBudget.save).toHaveBeenCalled(); // Проверка вызова сохранения
      expect(service.displayBudget).toHaveBeenCalledWith(true); // Проверка вызова displayBudget
  });

    it('should throw error if budget is not found', async () => {
      const mockAnswer: any = { id: 1};
      categoryRepository.findOne.mockResolvedValue(mockAnswer);
      userCategoryRepository.findOne.mockResolvedValue(mockAnswer);
      budgetRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateBudgetAmount({ category_id: 1, amount: 1000 }, 1),
      ).rejects.toThrow('Счет для данной категории не найден');
    });

    it('should throw error if category not found in updateBudgetAmount', async () => {
      const updateDto: CreateBudgetDto = { category_id: 1, amount: 5000 };
  
      categoryRepository.findOne.mockResolvedValue(null); 
  
      await expect(service.updateBudgetAmount(updateDto, 1)).rejects.toThrow(
          new HttpException('Категория не найдена', HttpStatus.NOT_FOUND),
      );
  });

  it('should throw error if user category not found in updateBudgetAmount', async () => {
    const updateDto: CreateBudgetDto = { category_id: 1, amount: 5000 };

    const mockCategory: any = {
        id: 1,
        name: 'Test Category',
    };

    categoryRepository.findOne.mockResolvedValue(mockCategory); 
    userCategoryRepository.findOne.mockResolvedValue(null); 

    await expect(service.updateBudgetAmount(updateDto, 1)).rejects.toThrow(
        new HttpException('Пользователь не указал процент трат категории', HttpStatus.NOT_FOUND),
    );
  });

  });

  describe('deleteBudget', () => {
    it('should delete a budget', async () => {
      const mockBudget:any = { id: 1, owner_id: 1 };
      const mockUserCategory: any = { id: 1, user_id: 1 };

      budgetRepository.findByPk.mockResolvedValue(mockBudget);
      userCategoryRepository.findByPk.mockResolvedValue(mockUserCategory);

      const result = await service.deleteBudget(1, 1);

      expect(budgetRepository.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ message: 'Счет 1 успешно удалён' });
    });

    it('should throw error if budget is not found', async () => {
      budgetRepository.findByPk.mockResolvedValue(null);

      await expect(service.deleteBudget(1, 1)).rejects.toThrow('Счет нен найден');
    });

    it('should throw error if user tries to delete someone else\'s budget', async () => {
      const mockBudget: any = { id: 1, owner_id: 1 };
      const mockUserCategory: any = { id: 1, user_id: 2 }; // Другой пользователь

      budgetRepository.findByPk.mockResolvedValue(mockBudget);
      userCategoryRepository.findByPk.mockResolvedValue(mockUserCategory);

      await expect(service.deleteBudget(1, 1)).rejects.toThrow('Вы не можете удалить чужой счет');
    });
  });

});