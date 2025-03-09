import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category-dto';
import { AssignCategoryDto } from './dto/assign-category-dto';
import { Role } from 'src/common/enums/roles.enum';
import { ExpenseType } from 'src/common/enums/expense-type.enum';
import { IdGuard } from 'src/common/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('CategoriesController', () => {
  let categoriesController: CategoriesController;
  let categoriesService: CategoriesService;

  const mockCategoriesService = {
    createCategory: jest.fn(),
    assignCategory: jest.fn(),
    findAllCategoriesByUser: jest.fn(),
    deleteCategory: jest.fn(),
    updateCategory: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn().mockReturnValue({ id: 1, role: Role.Admin }), // Замоканный метод верификации JWT
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        { provide: CategoriesService, useValue: mockCategoriesService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: Reflector, useValue: { get: jest.fn() } },
        IdGuard,
      ],
    }).compile();

    categoriesController = module.get<CategoriesController>(CategoriesController);
    categoriesService = module.get<CategoriesService>(CategoriesService);
  });

  it('should create a category (by admin)', async () => {
    const dto: CreateCategoryDto = {
      name: 'Test Category',
      expense_type: ExpenseType.Expenses,
      image_url: 'test-url',
      percentage: 0,
    };
    const req = { user: { id: 1, role: Role.Admin } };
    mockCategoriesService.createCategory.mockResolvedValue({
      id: 1,
      name: 'Test Category',
    });

    const result = await categoriesController.createCategory(dto, req);

    expect(categoriesService.createCategory).toHaveBeenCalledWith(dto, 1, true);
    expect(result).toEqual({ id: 1, name: 'Test Category' });
  });

  it('should create a category (by user)', async () => {
    const dto: CreateCategoryDto = {
      name: 'Test Category',
      expense_type: ExpenseType.Expenses,
      image_url: 'test-url',
      percentage: 0,
    };
    const req = { user: { id: 2, role: Role.User } };
    mockCategoriesService.createCategory.mockResolvedValue({
      id: 1,
      name: 'Test Category',
    });

    const result = await categoriesController.createCategory(dto, req);

    expect(categoriesService.createCategory).toHaveBeenCalledWith(dto, 2, false);
    expect(result).toEqual({ id: 1, name: 'Test Category' });
  });

  it('should throw error when creating category with invalid data', async () => {
    const dto: CreateCategoryDto = {
      name: '',
      expense_type: ExpenseType.Expenses,
      image_url: '',
      percentage: 0,
    };
    const req = { user: { id: 1, role: Role.Admin } };
    mockCategoriesService.createCategory.mockRejectedValue(
      new HttpException('Invalid data', HttpStatus.BAD_REQUEST),
    );

    await expect(categoriesController.createCategory(dto, req)).rejects.toThrow(
      'Invalid data',
    );
  });

  it('should assign a category to a user', async () => {
    const dto: AssignCategoryDto = { category_id: 1, percentage: 50 };
    const req = { user: { id: 1 } };
    mockCategoriesService.assignCategory.mockResolvedValue({
      id: 1,
      name: 'Test Category',
    });

    const result = await categoriesController.assignCategory(dto, req);

    expect(categoriesService.assignCategory).toHaveBeenCalledWith(
      dto.category_id,
      1,
      dto.percentage,
    );
    expect(result).toEqual({ id: 1, name: 'Test Category' });
  });

  it('should throw error when assigning non-existent category', async () => {
    const dto: AssignCategoryDto = { category_id: 999, percentage: 50 };
    const req = { user: { id: 1 } };
    mockCategoriesService.assignCategory.mockRejectedValue(
      new HttpException('Категория не найдена', HttpStatus.NOT_FOUND),
    );

    await expect(categoriesController.assignCategory(dto, req)).rejects.toThrow(
      'Категория не найдена',
    );
  });

  it('should return all categories', async () => {
    const req = { user: { id: 1, role: Role.Admin } };
    mockCategoriesService.findAllCategoriesByUser.mockResolvedValue([
      { id: 1, name: 'Test Category' },
    ]);

    const result = await categoriesController.getCategories(req);

    expect(categoriesService.findAllCategoriesByUser).toHaveBeenCalledWith(1, true);
    expect(result).toEqual([{ id: 1, name: 'Test Category' }]);
  });

  it('should delete a category', async () => {
    const req = { user: { id: 1, role: Role.Admin } };
    mockCategoriesService.deleteCategory.mockResolvedValue(
      'Категория с id 1 удалена.',
    );

    const result = await categoriesController.deleteCategories(req, '1');

    expect(categoriesService.deleteCategory).toHaveBeenCalledWith(1, true, 1);
    expect(result).toBe('Категория с id 1 удалена.');
  });

  it('should throw error when deleting non-existent category', async () => {
    const req = { user: { id: 1, role: Role.Admin } };
    mockCategoriesService.deleteCategory.mockRejectedValue(
      new HttpException('Категория не найдена', HttpStatus.NOT_FOUND),
    );

    await expect(categoriesController.deleteCategories(req, '999')).rejects.toThrow(
      'Категория не найдена',
    );
  });

  it('should update a category', async () => {
    const dto: CreateCategoryDto = {
      name: 'Updated Category',
      expense_type: ExpenseType.Expenses,
      image_url: 'updated-url',
      percentage: 25,
    };
    const req = { user: { id: 1, role: Role.Admin } };
    mockCategoriesService.updateCategory.mockResolvedValue({
      id: 1,
      name: 'Updated Category',
    });

    const result = await categoriesController.updateCategory(dto, req, '1');

    expect(categoriesService.updateCategory).toHaveBeenCalledWith(1, dto, 1, Role.Admin);
    expect(result).toEqual({ id: 1, name: 'Updated Category' });
  });

  it('should throw error when updating non-existent category', async () => {
    const dto: CreateCategoryDto = {
      name: 'Invalid Category',
      expense_type: ExpenseType.Expenses,
      image_url: 'invalid-url',
      percentage: 0,
    };
    const req = { user: { id: 1, role: Role.Admin } };
    mockCategoriesService.updateCategory.mockRejectedValue(
      new HttpException('Категория не найдена', HttpStatus.NOT_FOUND),
    );

    await expect(
      categoriesController.updateCategory(dto, req, '999'),
    ).rejects.toThrow('Категория не найдена');
  });
  
});