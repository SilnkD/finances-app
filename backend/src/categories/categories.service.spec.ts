import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { Category } from '../database/models/categories.model';
import { UserCategory } from 'src/database/models/user-categories.model';
import { CreateCategoryDto } from './dto/create-category-dto';
import { getModelToken } from '@nestjs/sequelize';
import { ExpenseType } from 'src/common/enums/expense-type.enum';
import { AccessType } from 'src/common/enums/access-type.enum';

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

    it('should throw an error if category not found', async () => {
      categoryModel.destroy.mockResolvedValue(0);
      await expect(service.deleteCategory(1, false, 1)).rejects.toThrow(HttpException);
    });
  });
});