import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/common/enums/roles.enum';
import { UsersService } from 'src/users/users.service';
import { BudgetService } from '../src/budget/budget.service';
import { ExpenseType } from 'src/common/enums/expense-type.enum';
import { TransactionsService } from '../src/transactions/transactions.service';
import { CreateTransactionDto } from '../src/transactions/dto/create-transaction-dto';
import { GoalsService } from 'src/goals/goals.service';
import { CreateGoalDto } from 'src/goals/dto/create-goal-dto';

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let userService: UsersService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        userService = moduleFixture.get<UsersService>(UsersService);
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });
    
    describe('POST /auth/register', () => {
        it('should register a user and return a token', async () => {
            const registerDto = { email: 'test@example.com', password: 'password', username: 'user' };
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send(registerDto)
                .expect(201);

            expect(response.body).toHaveProperty('token');
        });

        it('should return BAD_REQUEST if user already exists', async () => {
            const user = { email: 'test@example.com', password: 'password', username: 'user' };
            await request(app.getHttpServer())
                .post('/auth/register')
                .send(user);

            const duplicateUser = { email: 'test@example.com', password: 'password123', username: 'user2' };
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send(duplicateUser)
                .expect(400);

            expect(response.body.message).toBe('Пользователь с таким email уже зарегистрирован');
        });
    });

    describe('POST /auth/login', () => {
        it('should return a token if credentials with email are valid', async () => {
            const user = { email: 'test@example.com', password: 'password', username: 'user' };
            await request(app.getHttpServer())
                .post('/auth/register')
                .send(user);

            const loginDto = { user: 'test@example.com', password: 'password' };
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send(loginDto)
                .expect(201);

            expect(response.body).toHaveProperty('token');
        });

        it('should return a token if credentials with username are valid', async () => {
            const user = { email: 'test@example.com', password: 'password', username: 'testuser' };
            await request(app.getHttpServer())
                .post('/auth/register')
                .send(user);

            const loginDto = { user: 'testuser', password: 'password' };
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send(loginDto)
                .expect(201);

            expect(response.body).toHaveProperty('token');
        });

        it('should return UNAUTHORIZED for invalid username/password', async () => {
            const loginDto = { user: 'invaliduser', password: 'wrongpassword' };
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send(loginDto)
                .expect(401);

            expect(response.body.message).toBe('Неправильный email или пароль');
        });
    });

    describe('PUT /auth', () => {
        it('should update a user and return updated user data', async () => {
            const registerDto = { email: 'test@example.com', password: 'password', username: 'user' };
            await request(app.getHttpServer()).post('/auth/register').send(registerDto);

            const loginDto = { user: 'test@example.com', password: 'password' };
            const loginResponse = await request(app.getHttpServer())
                .post('/auth/login')
                .send(loginDto)
                .expect(201);

            const token = loginResponse.body.token;
            const updateUserDto = { username: 'newUser', password: 'newPassword' };

            const response = await request(app.getHttpServer())
                .put('/auth')
                .set('Authorization', `Bearer ${token}`)
                .send(updateUserDto)
                .expect(200);

            expect(response.body).toHaveProperty('username', 'newUser');
        });

        it('should return NOT_FOUND if user does not exist', async () => {
            const registerDto = { email: 'test@example.com', password: 'password', username: 'user' };
            await request(app.getHttpServer()).post('/auth/register').send(registerDto);
        
            const loginDto = { user: 'test@example.com', password: 'password' };
            const loginResponse = await request(app.getHttpServer())
                .post('/auth/login')
                .send(loginDto)
                .expect(201);
        
            const token = loginResponse.body.token;
        
            await userService.deleteUser(1); 
        
            const updateUserDto = { username: 'newUser', password: 'newPassword' };
        
            const response = await request(app.getHttpServer())
                .put('/auth')
                .set('Authorization', `Bearer ${token}`)
                .send(updateUserDto)
                .expect(404);
        
            expect(response.body.message).toBe('Пользователь не найден');
        });   
    }); 
});

describe('UsersController (e2e)', () => {
    let app: INestApplication;
    let jwtService: JwtService;
    let userService: UsersService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        jwtService = moduleFixture.get<JwtService>(JwtService);
        userService = moduleFixture.get<UsersService>(UsersService);
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('/users/assign-role (POST) should assign a role to a user', async () => {
        const user = {
            email: 'testAssignRole@example.com', 
            password: 'password', 
            username: 'user'
        };
        
        await request(app.getHttpServer())
            .post('/auth/register')
            .send(user);
    
        const roleDto = { id: 1, role: Role.Admin }; // Ensure id exists
        const token = jwtService.sign({ id: 1, role: Role.Admin });
    
        const response = await request(app.getHttpServer())
            .post('/users/assign-role')
            .set('Authorization', `Bearer ${token}`)
            .send(roleDto)
            .expect(201);
    
        expect(response.body).toHaveProperty('role', Role.Admin);
    });

    it('/users/all (GET) should return all users', async () => {
        
        const user = {
            email: 'testAssignRole@example.com', 
            password: 'password', 
            username: 'user'
        };

        const received = {
            email: 'testAssignRole@example.com',
            username: 'user',
            id: 1,
            role: 'USER',
            createdAt: expect.any(String), 
            updatedAt: expect.any(String), 
            password: expect.any(String), 
        };
        
        await request(app.getHttpServer())
            .post('/auth/register')
            .send(user);
    
        const token = jwtService.sign({ id: 1, role: Role.Admin });
    
        const response = await request(app.getHttpServer())
            .get('/users/all')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    
        expect(response.body).toEqual([received]);
    });    
    
    it('/users/delete/:id (DELETE) should throw error if user not found', async () => {
        const token = jwtService.sign({ id: 1, role: Role.Admin });

        await request(app.getHttpServer())
            .delete('/users/delete/999')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });
});

/*
describe('GoalsController (e2e)', () => {
    let app: INestApplication;
    let goalsService: GoalsService;
    let token: string; 
    let goalId: number; 

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        goalsService = moduleFixture.get<GoalsService>(GoalsService);
        await app.init();

        await request(app.getHttpServer()).post('/auth/register').send({ 
            email: 'test@example.com', 
            password: 'password', 
            username: 'testuser' 
        });

        const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ user: 'test@example.com', password: 'password' });
        token = loginResponse.body.token; 
    });

    afterEach(async () => {
        await app.close();
    });

    describe('POST /goals', () => {
        it('should create a new goal', async () => {
            const createGoalDto: CreateGoalDto = {
                name: 'Test Goal',
                target_amount: 1000,
                start_date: new Date().toISOString(),
                end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Завтрашняя дата
                budget_id: 1, 
            };

            const response = await request(app.getHttpServer())
                .post('/goals')
                .set('Authorization', `Bearer ${token}`)
                .send(createGoalDto)
                .expect(201);

            goalId = response.body.id; // Сохраняем ID созданной цели
            expect(response.body.name).toBe(createGoalDto.name);
        });
    });

    describe('GET /goals', () => {
        it('should retrieve all goals (Admin)', async () => {
            const response = await request(app.getHttpServer())
                .get('/goals') 
                .set('Authorization', `Bearer ${token}`) // Предполагаем, что токен администратора
                .expect(200);
            
            expect(Array.isArray(response.body)).toBeTruthy();
        });
    });

    describe('GET /goals/user', () => {
        it('should retrieve goals for the authenticated user', async () => {
            const response = await request(app.getHttpServer())
                .get('/goals/user')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBeTruthy();
        });
    });

    describe('PUT /goals/:id', () => {
        it('should update an existing goal', async () => {
            const updateGoalDto = {
                name: 'Updated Goal',
                target_amount: 1500,
            };

            const response = await request(app.getHttpServer())
                .put(`/goals/${goalId}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateGoalDto)
                .expect(200);

            expect(response.body.name).toBe(updateGoalDto.name);
            expect(response.body.target_amount).toBe(updateGoalDto.target_amount);
        });
    });

    describe('DELETE /goals/:id', () => {
        it('should delete an existing goal', async () => {
            await request(app.getHttpServer())
                .delete(`/goals/delete/${goalId}`) 
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            // Проверяем, что цель удалена
            const getResponse = await request(app.getHttpServer())
                .get(`/goals/user`) 
                .set('Authorization', `Bearer ${token}`);
            expect(getResponse.body.find((goal) => goal.id === goalId)).toBeUndefined();
        });
    });
});

describe('CategoriesController (e2e)', () => {
    let app: INestApplication;
    let jwtService: JwtService;
    let createdCategoryId: number;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],  // Убедитесь, что ваш модуль категорий импортирован
        }).compile();

        app = moduleFixture.createNestApplication();
        jwtService = moduleFixture.get<JwtService>(JwtService);
        await app.init();
    });

    afterEach(async () => {
        // Удаляем созданные категории после каждого теста
        if (createdCategoryId) {
            const token = jwtService.sign({ id: 1, role: Role.Admin }); // Admin token
            await request(app.getHttpServer())
                .delete(`/categories/delete/${createdCategoryId}`)
                .set('Authorization', `Bearer ${token}`);
        }
        await app.close();
    });

    it('/categories (POST) should create a category and return the created category', async () => {
        const createCategoryDto = {
            name: 'New Category',
            expense_type: ExpenseType.Expenses,
            image_url: 'http://example.com/image.png',
            percentage: 50
        };
        const token = jwtService.sign({ id: 1, role: Role.Admin });

        const response = await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${token}`)
            .send(createCategoryDto)
            .expect(201);

        createdCategoryId = response.body.id; // Сохраняем id для удаления
        expect(response.body).toHaveProperty('id');
    });

    it('/categories (GET) should return categories for user', async () => {
        const token = jwtService.sign({ id: 1, role: Role.User });
        const response = await request(app.getHttpServer())
            .get('/categories')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
    });

    it('/categories (GET) should return all categories for admin', async () => {
        const token = jwtService.sign({ id: 1, role: Role.Admin });
        const response = await request(app.getHttpServer())
            .get('/categories')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
    });

    it('/categories/:id (DELETE) should return NOT_FOUND if category is not found', async () => {
        const categoryId = 999; // Non-existing ID
        const token = jwtService.sign({ id: 1, role: Role.Admin });

        await request(app.getHttpServer())
            .delete(`/categories/delete/${categoryId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });
});

describe('BudgetController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let budgetService: BudgetService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    budgetService = moduleFixture.get<BudgetService>(BudgetService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /budgets', () => {

    it('should return 404 if category not found', async () => {
      const token = jwtService.sign({ id: 1 });
      const createBudgetDto = { category_id: 999, amount: 1000 };

      const response = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send(createBudgetDto)
        .expect(404);

      expect(response.body.message).toBe('Категория не найдена');
    });

    it('should return 404 if user category not found', async () => {
      const token = jwtService.sign({ id: 1 });
      const createBudgetDto = { category_id: 1, amount: 1000 };

      jest.spyOn(budgetService, 'createBudget').mockRejectedValueOnce(
        new HttpException('Пользователь не указал процент трат категории', HttpStatus.NOT_FOUND),
      );

      const response = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send(createBudgetDto)
        .expect(404);

      expect(response.body.message).toBe('Пользователь не указал процент трат категории');
    });

    it('should return 400 if budget already exists', async () => {
      const token = jwtService.sign({ id: 1 });
      const createBudgetDto = { category_id: 1, amount: 1000 };

      jest.spyOn(budgetService, 'createBudget').mockRejectedValueOnce(
        new HttpException('Счет для данной категории уже существует', HttpStatus.BAD_REQUEST),
      );

      const response = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send(createBudgetDto)
        .expect(400);

      expect(response.body.message).toBe('Счет для данной категории уже существует');
    });
  });

  describe('GET /budgets', () => {
    it('should return user budgets', async () => {
      const token = jwtService.sign({ id: 1 });

      const mockBudgets = [
        { id: 1, category_name: 'Food', amount: 1000 },
        { id: 2, category_name: 'Transport', amount: 500 },
      ];

      jest.spyOn(budgetService, 'getUserBudgets').mockResolvedValueOnce(mockBudgets);

      const response = await request(app.getHttpServer())
        .get('/budgets')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual(mockBudgets);
    });
  });

  describe('PUT /budgets', () => {
    it('should update budget amount', async () => {
      const token = jwtService.sign({ id: 1 });
      const updateBudgetDto = { category_id: 1, amount: 1500 };

      const mockUpdatedBudget = { id: 1, category_name: 'Food', amount: 1500 };

      jest.spyOn(budgetService, 'updateBudgetAmount').mockResolvedValueOnce(mockUpdatedBudget);

      const response = await request(app.getHttpServer())
        .put('/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send(updateBudgetDto)
        .expect(200);

      expect(response.body).toEqual(mockUpdatedBudget);
    });

    it('should return 404 if category not found', async () => {
      const token = jwtService.sign({ id: 1 });
      const updateBudgetDto = { category_id: 999, amount: 1500 };

      jest.spyOn(budgetService, 'updateBudgetAmount').mockRejectedValueOnce(
        new HttpException('Категория не найдена', HttpStatus.NOT_FOUND),
      );

      const response = await request(app.getHttpServer())
        .put('/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send(updateBudgetDto)
        .expect(404);

      expect(response.body.message).toBe('Категория не найдена');
    });

    it('should return 404 if user category not found', async () => {
      const token = jwtService.sign({ id: 1 });
      const updateBudgetDto = { category_id: 1, amount: 1500 };

      jest.spyOn(budgetService, 'updateBudgetAmount').mockRejectedValueOnce(
        new HttpException('Пользователь не указал процент трат категории', HttpStatus.NOT_FOUND),
      );

      const response = await request(app.getHttpServer())
        .put('/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send(updateBudgetDto)
        .expect(404);

      expect(response.body.message).toBe('Пользователь не указал процент трат категории');
    });

    it('should return 404 if budget not found', async () => {
      const token = jwtService.sign({ id: 1 });
      const updateBudgetDto = { category_id: 1, amount: 1500 };

      jest.spyOn(budgetService, 'updateBudgetAmount').mockRejectedValueOnce(
        new HttpException('Счет для данной категории не найден', HttpStatus.NOT_FOUND),
      );

      const response = await request(app.getHttpServer())
        .put('/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send(updateBudgetDto)
        .expect(404);

      expect(response.body.message).toBe('Счет для данной категории не найден');
    });
  });

  describe('DELETE /budgets/:id', () => {
    it('should delete a budget', async () => {
      const token = jwtService.sign({ id: 1 });

      jest.spyOn(budgetService, 'deleteBudget').mockResolvedValueOnce({ message: 'Счет 1 успешно удалён' });

      const response = await request(app.getHttpServer())
        .delete('/budgets/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({ message: 'Счет 1 успешно удалён' });
    });

    it('should return 404 if budget not found', async () => {
      const token = jwtService.sign({ id: 1 });

      jest.spyOn(budgetService, 'deleteBudget').mockRejectedValueOnce(
        new HttpException('Счет не найден', HttpStatus.NOT_FOUND),
      );

      const response = await request(app.getHttpServer())
        .delete('/budgets/999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toBe('Счет не найден');
    });

    it('should return 403 if user tries to delete someone else\'s budget', async () => {
      const token = jwtService.sign({ id: 1 });

      jest.spyOn(budgetService, 'deleteBudget').mockRejectedValueOnce(
        new HttpException('Вы не можете удалить чужой счет', HttpStatus.FORBIDDEN),
      );

      const response = await request(app.getHttpServer())
        .delete('/budgets/2')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.message).toBe('Вы не можете удалить чужой счет');
    });
  });
});

describe('TransactionsController (e2e)', () => {
  let app: INestApplication;
  let transactionsService: TransactionsService;
  let jwtService: JwtService;

  
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    transactionsService = moduleFixture.get<TransactionsService>(TransactionsService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/transactions (POST)', () => {

    it('should return 404 if budget does not exist', async () => {
      const createTransactionDto: CreateTransactionDto = {
        budget_id: 999, // Несуществующий бюджет
        amount: 100,
        date: '2025-03-20T11:01:08.902Z',
        description: 'Test transaction',
      };

      const token = jwtService.sign({ id: 1, role: Role.User });

      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send(createTransactionDto)
        .expect(404);
    });
  });

  describe('/transactions/:budget_id (GET)', () => {
    it('should return transactions for a budget', async () => {
      const budgetId = 1;
      const token = jwtService.sign({ id: 1, role: Role.User });

      const response = await request(app.getHttpServer())
        .get(`/transactions/${budgetId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return an empty array if no transactions exist for the budget', async () => {
      const budgetId = 999; // Несуществующий бюджет
      const token = jwtService.sign({ id: 1, role: Role.User });

      const response = await request(app.getHttpServer())
        .get(`/transactions/${budgetId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('/transactions/:id (DELETE)', () => {

    it('should return 404 if transaction does not exist', async () => {
      const transactionId = 999; // Несуществующая транзакция
      const token = jwtService.sign({ id: 1, role: Role.User });

      await request(app.getHttpServer())
        .delete(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});*/