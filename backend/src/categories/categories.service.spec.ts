import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { Category } from '../database/models/categories.model';
import { UserCategory } from 'src/database/models/user-categories.model';
import { CreateCategoryDto } from './dto/create-category-dto';
import { getModelToken } from '@nestjs/sequelize';
import { ExpenseType } from 'src/common/enums/expense-type.enum';
import { AccessType } from 'src/common/enums/access-type.enum';
import { Op } from 'sequelize';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryModel: jest.Mocked<typeof Category>;
  let userCategoryModel: jest.Mocked<typeof UserCategory>;

  beforeEach(async () => {
    categoryModel = {
      create: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn(),
      destroy: jest.fn(),
      update: jest.fn(),
    } as any;

    userCategoryModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      destroy: jest.fn(),
      update: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getModelToken(Category),
          useValue: categoryModel,
        },
        {
          provide: getModelToken(UserCategory),
          useValue: userCategoryModel,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCategory', () => {
    it('should create and return category for user', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: 'New Category',
        expense_type: ExpenseType.Expenses,
        image_url: 'http://example.com/image.png',
        percentage: 50,
      };
    
      const mockCategory: any = { id: 1, ...createCategoryDto, access_type: AccessType.Private, users: [] };
    
      categoryModel.create.mockResolvedValue(mockCategory);
      userCategoryModel.create.mockResolvedValue({ user_id: 1, category_id: 1, percentage: 50 });
      categoryModel.findByPk.mockResolvedValue(mockCategory);
    
      const result = await service.createCategory(createCategoryDto, 1, false);
     
      expect(result).toEqual({
        id: 1,
        name: 'New Category',
        expense_type: 'EXPENSE',
        access_type: AccessType.Private,
        image_url: 'http://example.com/image.png',
        users: expect.any(Array),
      });
    });
    
    it('should create and return category for admin', async () => {
      const createCategoryDto: CreateCategoryDto = {
          name: 'Admin Category',
          expense_type: ExpenseType.Expenses,
          image_url: 'http://example.com/admin-image.png',
          percentage: 50,
      };
  
      const mockCategory: any = { id: 1, ...createCategoryDto, access_type: AccessType.Public, save: jest.fn(), users: [] };
  
      categoryModel.create.mockResolvedValue(mockCategory);
      categoryModel.findByPk.mockResolvedValue(mockCategory);
  
      const result = await service.createCategory(createCategoryDto, 1, true);
  
      expect(result).toEqual({
          id: 1,
          name: 'Admin Category',
          expense_type: 'EXPENSE',
          access_type: AccessType.Public,
          image_url: 'http://example.com/admin-image.png',
          users: expect.any(Array),
      });
  
      // Проверяем, что категория была сохранена с правильным доступом
      expect(mockCategory.access_type).toBe(AccessType.Public);
    });
  });

  describe('findAllCategoriesByUser', () => {

    it('should return all categories for admin', async () => {
        const mockCategories: any = [
            { id: 1, name: 'Category 1', access_type: AccessType.Public },
            { id: 2, name: 'Category 2', access_type: AccessType.Private },
        ];

        // Мокаем метод findAll для возврата всех категорий
        categoryModel.findAll.mockResolvedValue(mockCategories);
        
        // Мокаем метод displayCategoryData
        service.displayCategoryData = jest.fn().mockImplementation(category => category); // Возвращаем категорию без изменений

        const result = await service.findAllCategoriesByUser(1, true);

        expect(result).toEqual(mockCategories);
        expect(categoryModel.findAll).toHaveBeenCalledWith({ include: { all: true } });
        expect(service.displayCategoryData).toHaveBeenCalledTimes(mockCategories.length);
    });

    it('should return only user-specific categories for non-admin', async () => {
        const user_id = 1;
        const mockUserCategories: any = [
            { category_id: 1 },
            { category_id: 2 },
        ];

        const mockCategories: any = [
            { id: 1, name: 'User Category 1', access_type: AccessType.Private },
            { id: 2, name: 'User Category 2', access_type: AccessType.Public },
            { id: 3, name: 'Category 3', access_type: AccessType.Private },
        ];

        // Мокаем методы для возврата категорий пользователя
        userCategoryModel.findAll.mockResolvedValue(mockUserCategories);
        categoryModel.findAll.mockResolvedValue(mockCategories);
        
        // Мокаем метод displayCategoryData
        service.displayCategoryData = jest.fn().mockImplementation(category => category); // Возвращаем категорию без изменений

        const result = await service.findAllCategoriesByUser(user_id, false);

        expect(result).toEqual(mockCategories);
        expect(userCategoryModel.findAll).toHaveBeenCalledWith({ where: { user_id } });
        expect(categoryModel.findAll).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    { id: mockUserCategories.map(uc => uc.category_id) },
                    { access_type: AccessType.Public },
                ]
            },
            include: { all: true }
        });
        expect(service.displayCategoryData).toHaveBeenCalledTimes(mockCategories.length);
    });

  });

  describe('assignCategory', () => {
    it('should throw an error if category not found', async () => {
      await expect(service.assignCategory(999, 1, 50)).rejects.toThrow(HttpException);
    });

    it('should assign category to user', async () => {
      const mockCategory: any = {
        id: 1,
        name: 'Test Category',
        expense_type: 'EXPENSE',
        access_type: AccessType.Public,
        image_url: 'http://example.com/image.png',
        users: [
          {
            UserCategory: {
              user_id: 2,
              category_id: 1,
              percentage: 50,
            },
          },
        ],
      };
    
      categoryModel.findByPk.mockResolvedValue(mockCategory); 
      userCategoryModel.findOne.mockResolvedValue(null); 
    
      const result = await service.assignCategory(1, 1, 50);
    
      expect(result).toEqual(expect.any(Object));
      expect(userCategoryModel.create).toHaveBeenCalledWith({ user_id: 1, category_id: 1, percentage: 50 });
    });     

    it('should throw an error if category is already assigned to user', async () => {
      const mockCategory: any = {
          id: 1,
          name: 'Test Category',
          expense_type: 'EXPENSE',
          access_type: AccessType.Private,
          image_url: 'http://example.com/image.png',
          users: [
              {
                  UserCategory: {
                      user_id: 1, // Текущий пользователь
                      category_id: 1,
                      percentage: 50,
                  },
              },
          ],
      };

      const mockUserCategory: any = {
        user_id:1,
        category_id: 1,
        percentage: 50
      }

      categoryModel.findByPk.mockResolvedValue(mockCategory); 
      userCategoryModel.findOne.mockResolvedValue(mockUserCategory); // Имитация существующей записи для пользователя

      await expect(service.assignCategory(1, 1, 50)).rejects.toThrow('Категория уже присвоена пользователю');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category for admin', async () => {
      const mockCategory: any = {
        id: 1,
        name: 'Test Category',
        expense_type: AccessType.Public,
        access_type: AccessType.Public,
      };
      categoryModel.findByPk.mockResolvedValue(mockCategory);
      categoryModel.destroy.mockResolvedValue(1);

      const result = await service.deleteCategory(1, true, 1);
      expect(result).toBe('Категория с id 1 удалена.');
    });

    it('should delete user-specific category and return confirmation message', async () => {
      const mockCategory: any = { id: 1, access_type: AccessType.Public };
      categoryModel.findByPk.mockResolvedValue(mockCategory);
      userCategoryModel.destroy.mockResolvedValue(1); // Симуляция успешного удаления

      const result = await service.deleteCategory(1, false, 1);

      expect(result).toBe('Категория пользователя с id 1 удалена.');
      expect(userCategoryModel.destroy).toHaveBeenCalledWith({ where: { user_id: 1, category_id: 1 } });
  });

    it('should throw an error if category not found', async () => {
      categoryModel.destroy.mockResolvedValue(0);
      await expect(service.deleteCategory(1, false, 1)).rejects.toThrow(HttpException);
    });
  });

  describe('displayCategoryData', () => {
  
    it('should return category data with user records filtered for a specific user', async () => {
      const mockCategory = {
        id: 1,
        name: 'Mock Category',
        expense_type: 'EXPENSE',
        access_type: 'PRIVATE',
        image_url: 'http://example.com/image.png',
        users: [
          { UserCategory: { user_id: 1, category_id: 1, percentage: 50 } },
          { UserCategory: { user_id: 2, category_id: 1, percentage: 50 } },
        ],
      };
  
      const result = await service.displayCategoryData(mockCategory, 1, true);
  
      expect(result).toEqual({
        id: 1,
        name: 'Mock Category',
        expense_type: 'EXPENSE',
        access_type: 'PRIVATE',
        image_url: 'http://example.com/image.png',
        users: [
          { user_id: 1, category_id: 1, percentage: 50 },
        ],
      });
    });
  
    it('should return category data with all user records', async () => {
      const mockCategory = {
        id: 1,
        name: 'Mock Category',
        expense_type: 'EXPENSE',
        access_type: 'PRIVATE',
        image_url: 'http://example.com/image.png',
        users: [
          { UserCategory: { user_id: 1, category_id: 1, percentage: 50 } },
          { UserCategory: { user_id: 2, category_id: 1, percentage: 50 } },
        ],
      };
  
      const result = await service.displayCategoryData(mockCategory, undefined, false);
  
      expect(result).toEqual({
        id: 1,
        name: 'Mock Category',
        expense_type: 'EXPENSE',
        access_type: 'PRIVATE',
        image_url: 'http://example.com/image.png',
        users: [
          { user_id: 1, category_id: 1, percentage: 50 },
          { user_id: 2, category_id: 1, percentage: 50 },
        ],
      });
    });
  
  });  

  describe('updateCategory', () => {

    it('should update category for admin and return updated category data', async () => {
      const updateDto: CreateCategoryDto = {
          name: 'Updated Category',
          expense_type: ExpenseType.Expenses,
          image_url: 'http://example.com/updated-image.png',
          percentage: 50,
      };
  
      const mockCategory: any = {
          id: 1,
          access_type: AccessType.Public,
          users: [
              {
                  UserCategory: {
                      user_id: 1,
                      category_id: 1,
                      percentage: 10,
                  },
              },
          ],
      };
  
      categoryModel.findByPk
          .mockResolvedValueOnce(mockCategory) // Для проверки наличия категории
          .mockResolvedValueOnce({ ...mockCategory, ...updateDto }); // Для возврата обновленной категории
  
      categoryModel.update.mockResolvedValue([1]); // Успешное обновление
  
      const result = await service.updateCategory(1, updateDto, 1, true);
  
      expect(result).toEqual(await service.displayCategoryData({ ...mockCategory, ...updateDto }));
      expect(categoryModel.update).toHaveBeenCalledWith(updateDto, { where: { id: 1 } });
      expect(categoryModel.findByPk).toHaveBeenCalledTimes(2);
   });

    it('should update user-specific category and return confirmation message', async () => {
        const updateDto: CreateCategoryDto = {
            name: 'Updated Category',
            expense_type: ExpenseType.Expenses,
            image_url: 'http://example.com/updated-image.png',
            percentage: 50,
        };

        const mockCategory: any = { id: 1, access_type: AccessType.Private };
        categoryModel.findByPk.mockResolvedValue(mockCategory);
        userCategoryModel.update.mockResolvedValue([1]); // Успешное обновление для пользователя

        const result = await service.updateCategory(1, updateDto, 1, false);

        expect(result).toBe(`Категория пользователя с id 1 обновлена.`);
        expect(userCategoryModel.update).toHaveBeenCalledWith({ percentage: updateDto.percentage }, { where: { user_id: 1, category_id: 1 } });
    });

    it('should throw an error if category to update is not found', async () => {
      const updateDto: CreateCategoryDto = {
        name: '',
        expense_type: ExpenseType.Expenses,
        image_url: '',
        percentage: 0,
      };
        categoryModel.findByPk.mockResolvedValue(null); // Категория не найдена
        await expect(service.updateCategory(1, updateDto, 1, false)).rejects.toThrow(HttpException);
    });
  });
});