import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/common/enums/roles.enum';
import { CategoriesService } from 'src/categories/categories.service';
import { UsersService } from 'src/users/users.service';

describe('AuthController (e2e)', () => {
      let app: INestApplication;
      let jwtService: JwtService;

      let userService = { 
        createUser: jest.fn(), 
        assignRole: jest.fn(), 
        getAllUsers: jest.fn(),
        getUsersByEmail: jest.fn(), 
        getUsersByName: jest.fn(), 
        getUserById: jest.fn(),
        deleteUser: jest.fn(), 
        updateUser: jest.fn(),
    };

      let authService = { 
          login: jest.fn(), 
          register: jest.fn(), 
          updateUser: jest.fn(),
          userService
      };

      beforeEach(async () => {
          const moduleFixture: TestingModule = await Test.createTestingModule({
              imports: [AppModule],
          })
          .overrideProvider(AuthService)
          .useValue(authService) 
          .compile();

          app = moduleFixture.createNestApplication();
          jwtService = moduleFixture.get<JwtService>(JwtService); // Подключаем JwtService
          await app.init();
      });

      afterEach(async () => {
          await app.close();
      });

      it('/auth (PUT) should update a user and return updated user data', async () => {
          const updateUserDto = { username: 'newUser', password: 'newPassword' };
          const mockUserResponse = { id: 1, email: 'test@example.com', username: 'newUser' };

          authService.updateUser.mockResolvedValue(mockUserResponse);

          // Генерация валидного токена с помощью JwtService
          const token = jwtService.sign({ id: 1, email: 'test@example.com', role: Role.User });

          const response = await request(app.getHttpServer())
              .put('/auth')
              .set('Authorization', `Bearer ${token}`) // Передаем токен в заголовке
              .send(updateUserDto)
              .expect(200);

          expect(response.body).toEqual(mockUserResponse);
          expect(authService.updateUser).toHaveBeenCalledWith(updateUserDto, expect.any(Number)); 
      });
      
    it('/auth/login (POST) should return a token', async () => {
        const loginDto = { user: 'test@example.com', password: 'password' };
        const tokenResponse = { token: 'test-token' };

        authService.login.mockResolvedValue(tokenResponse);

        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send(loginDto)
            .expect(201);

        expect(response.body).toEqual(tokenResponse);
        expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('/auth/register (POST) should register a user and return a token', async () => {
        const registerDto = { email: 'test@example.com', password: 'password', username: 'user' };
        const tokenResponse = { token: 'test-token' };

        authService.register.mockResolvedValue(tokenResponse);

        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send(registerDto)
            .expect(201);

        expect(response.body).toEqual(tokenResponse);
        expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
});

describe('CategoriesController (e2e)', () => {
    let app: INestApplication;
    let jwtService: JwtService;

    // Моки сервисов
    let categService = {
        createCategory: jest.fn(),
        assignCategory: jest.fn(),
        findAllCategoriesByUser: jest.fn(),
        deleteCategory: jest.fn(),
        updateCategory: jest.fn(),
    };

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
        .overrideProvider(CategoriesService)
        .useValue(categService)
        .compile();

        app = moduleFixture.createNestApplication();
        jwtService = moduleFixture.get<JwtService>(JwtService);

        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('/categories (POST) should create a category and return the created category', async () => {
        const createCategoryDto = { name: 'New Category', expense_type: 'EXPENSE', image_url: 'http://example.com/image.png', percentage: 50 };
        const mockCategoryResponse = { id: 1, ...createCategoryDto };

        categService.createCategory.mockResolvedValue(mockCategoryResponse);
        const token = jwtService.sign({ id: 1, role: Role.Admin });

        const response = await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${token}`)
            .send(createCategoryDto)
            .expect(201);

        expect(response.body).toEqual(mockCategoryResponse);
        expect(categService.createCategory).toHaveBeenCalledWith(createCategoryDto, 1, true);
    });

    it('/categories (POST) should throw error if category creation fails', async () => {
        const createCategoryDto = { name: 'New Category', expense_type: 'EXPENSE', image_url: 'http://example.com/image.png', percentage: 50 };
        const token = jwtService.sign({ id: 1, role: Role.Admin });

        categService.createCategory.mockRejectedValue(new HttpException('Ошибка создания категории', HttpStatus.INTERNAL_SERVER_ERROR));

        const response = await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${token}`)
            .send(createCategoryDto)
            .expect(500);

        expect(response.body.message).toEqual('Ошибка создания категории');
    });

    it('/categories/assign (POST) should assign a category to user and return success message', async () => {
        const assignCategoryDto = { category_id: 1, percentage: 50 };
        const mockAssignResponse = { id: 1, name: 'New Category', percentage: 50 };

        categService.assignCategory.mockResolvedValue(mockAssignResponse);
        const token = jwtService.sign({ id: 1, role: Role.User });

        const response = await request(app.getHttpServer())
            .post('/categories/assign')
            .set('Authorization', `Bearer ${token}`)
            .send(assignCategoryDto)
            .expect(201);

        expect(response.body).toEqual(mockAssignResponse);
        expect(categService.assignCategory).toHaveBeenCalledWith(assignCategoryDto.category_id, 1, assignCategoryDto.percentage);
    });

    it('/categories/assign (POST) should throw error if category assignment fails', async () => {
        const assignCategoryDto = { category_id: 1, percentage: 50 };
        const token = jwtService.sign({ id: 1, role: Role.User });

        categService.assignCategory.mockRejectedValue(new HttpException('Категория не найдена', HttpStatus.NOT_FOUND));

        const response = await request(app.getHttpServer())
            .post('/categories/assign')
            .set('Authorization', `Bearer ${token}`)
            .send(assignCategoryDto)
            .expect(404);

        expect(response.body.message).toEqual('Категория не найдена');
    });

    it('/categories (GET) should return categories for user', async () => {
        const mockCategoriesResponse = [{ id: 1, name: 'Category 1' }, { id: 2, name: 'Category 2' }];
        categService.findAllCategoriesByUser.mockResolvedValue(mockCategoriesResponse);
        
        const token = jwtService.sign({ id: 1, role: Role.User });

        const response = await request(app.getHttpServer())
            .get('/categories')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body).toEqual(mockCategoriesResponse);
        expect(categService.findAllCategoriesByUser).toHaveBeenCalledWith(1, false);
    });

    it('/categories (GET) should throw an error if category retrieval fails', async () => {
        const token = jwtService.sign({ id: 1, role: Role.User });
        categService.findAllCategoriesByUser.mockRejectedValue(new HttpException('Ошибка получения категорий', HttpStatus.INTERNAL_SERVER_ERROR));

        const response = await request(app.getHttpServer())
            .get('/categories')
            .set('Authorization', `Bearer ${token}`)
            .expect(500);

        expect(response.body.message).toEqual('Ошибка получения категорий');
    });

    it('/categories/delete/:id (DELETE) should delete a category and return success message', async () => {
        const mockDeleteResponse = { message: 'Категория с id 1 успешно удалена.' };
        categService.deleteCategory.mockResolvedValue(mockDeleteResponse);

        const token = jwtService.sign({ id: 1, role: Role.Admin });

        const response = await request(app.getHttpServer())
            .delete('/categories/delete/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body).toEqual(mockDeleteResponse);
        expect(categService.deleteCategory).toHaveBeenCalledWith(1, true, 1);
    });

    it('/categories/delete/:id (DELETE) should throw error if category deletion fails', async () => {
        const token = jwtService.sign({ id: 1, role: Role.Admin });
        categService.deleteCategory.mockRejectedValue(new HttpException('Категория не найдена', HttpStatus.NOT_FOUND));

        const response = await request(app.getHttpServer())
            .delete('/categories/delete/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);

        expect(response.body.message).toEqual('Категория не найдена');
    });

    it('/categories/:id (PUT) should update a category and return updated category data', async () => {
        const updateCategoryDto = { name: 'Updated Category', expense_type: 'EXPENSE', image_url: 'http://example.com/updated-image.png', percentage: 50 };
        const updatedCategoryResponse = { id: 1, ...updateCategoryDto };

        categService.updateCategory.mockResolvedValue(updatedCategoryResponse);
        const token = jwtService.sign({ id: 1, role: Role.Admin });

        const response = await request(app.getHttpServer())
            .put('/categories/1')
            .set('Authorization', `Bearer ${token}`)
            .send(updateCategoryDto)
            .expect(200);

        expect(response.body).toEqual(updatedCategoryResponse);
        expect(categService.updateCategory).toHaveBeenCalledWith(1, updateCategoryDto, 1, "ADMIN");
    });

    it('/categories/:id (PUT) should throw error if category update fails', async () => {
        const updateCategoryDto = { name: 'Updated Category', expense_type: 'EXPENSE', image_url: 'http://example.com/updated-image.png', percentage: 50 };
        const token = jwtService.sign({ id: 1, role: Role.Admin });

        categService.updateCategory.mockRejectedValue(new HttpException('Категория не найдена', HttpStatus.NOT_FOUND));

        const response = await request(app.getHttpServer())
            .put('/categories/1')
            .set('Authorization', `Bearer ${token}`)
            .send(updateCategoryDto)
            .expect(404);

        expect(response.body.message).toEqual('Категория не найдена');
    });
});

describe('UsersController (e2e)', () => {
    let app: INestApplication;
    let jwtService: JwtService;

    // Мокируем сервис пользователей
    let usersService = {
        assignRole: jest.fn(),
        getAllUsers: jest.fn(),
        deleteUser: jest.fn(),
    };

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
        .overrideProvider(UsersService)
        .useValue(usersService)
        .compile();

        app = moduleFixture.createNestApplication();
        jwtService = moduleFixture.get<JwtService>(JwtService);
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('/users/assign-role (POST) should assign a role to a user', async () => {
        const roleDto = { id: 1, role: Role.Admin };
        const mockUserResponse = { id: 1, role: Role.Admin };

        usersService.assignRole.mockResolvedValue(mockUserResponse);
        const token = jwtService.sign({ id: 1, role: Role.Admin });

        const response = await request(app.getHttpServer())
            .post('/users/assign-role')
            .set('Authorization', `Bearer ${token}`)
            .send(roleDto)
            .expect(201);

        expect(response.body).toEqual(mockUserResponse);
        expect(usersService.assignRole).toHaveBeenCalledWith(roleDto);
    });

    it('/users/assign-role (POST) should throw error if user not found', async () => {
        const roleDto = { id: 999, role: Role.User }; 
        usersService.assignRole.mockRejectedValue(new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND)); 
    
        const token = jwtService.sign({ id: 1, role: Role.Admin });
    
        await request(app.getHttpServer())
            .post('/users/assign-role')
            .set('Authorization', `Bearer ${token}`)
            .send(roleDto)
            .expect(404); // Ожидаем ошибку 404
    });    

    it('/users/all (GET) should return all users', async () => {
        const mockUsersResponse = [{ id: 1, username: 'testuser', role: Role.User }, { id: 2, username: 'adminuser', role: Role.Admin }];
        usersService.getAllUsers.mockResolvedValue(mockUsersResponse);
        const token = jwtService.sign({ id: 1, role: Role.Admin });

        const response = await request(app.getHttpServer())
            .get('/users/all')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body).toEqual(mockUsersResponse);
        expect(usersService.getAllUsers).toHaveBeenCalled();
    });

    it('/users/delete/:id (DELETE) should delete a user and return success message', async () => {
        const mockDeleteResponse = `Пользователь с id 1 удален.`;
        usersService.deleteUser.mockResolvedValue(mockDeleteResponse);
        const token = jwtService.sign({ id: 1, role: Role.Admin });

        const response = await request(app.getHttpServer())
            .delete('/users/delete/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.text).toBe(mockDeleteResponse);
        expect(usersService.deleteUser).toHaveBeenCalledWith(1);
    });

    it('/users/delete/:id (DELETE) should throw error if user not found', async () => {
        usersService.deleteUser.mockRejectedValue(new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND));
        const token = jwtService.sign({ id: 1, role: Role.Admin });

        await request(app.getHttpServer())
            .delete('/users/delete/999')
            .set('Authorization', `Bearer ${token}`)
            .expect(404); // Ожидаем ошибку 404
    });
});