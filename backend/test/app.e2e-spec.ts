import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { BudgetService } from '../src/budget/budget.service';
import { ExpenseType } from 'src/common/enums/expense-type.enum';
import { Category } from 'src/database/models/categories.model';
import { UserCategory } from 'src/database/models/user-categories.model';
import { Budget } from 'src/database/models/budget.model';
import { Role } from 'src/common/enums/roles.enum';
import { UsersService } from 'src/users/users.service'; 
import { GoalsService } from 'src/goals/goals.service';
import { CreateGoalDto } from 'src/goals/dto/create-goal-dto';
import { decode } from 'jsonwebtoken'; 
import { TransactionsService } from 'src/transactions/transactions.service';
import { CreateTransactionDto } from 'src/transactions/dto/create-transaction-dto';
import { AccessType } from 'src/common/enums/access-type.enum';

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

describe('CategoriesController (e2e)', () => {
    let app: INestApplication;
    let jwtService: JwtService;
    let createdCategoryId: number;
    let userId: number;
    let adminToken: string;
    let userToken: string;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        jwtService = moduleFixture.get<JwtService>(JwtService);
        await app.init();

        // Регистрация администратора и пользователя
        const adminResponse = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'admin@example.com', password: 'adminpassword', username: 'adminuser' })
            .expect(201);
        adminToken = adminResponse.body.token;

        const userResponse = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'testuser@example.com', password: 'password', username: 'testuser' })
            .expect(201);
        
        const token = userResponse.body.token;
        const decodedToken: any = decode(token);
        userId = decodedToken.id;
        userToken = token; // Сохраняем токен
    });

    afterEach(async () => {
        if (createdCategoryId) {
            await request(app.getHttpServer())
                .delete(`/categories/delete/${createdCategoryId}`)
                .set('Authorization', `Bearer ${adminToken}`);
        }
    });

    afterAll(async () => {
        await app.close();
    });

    it('POST /categories should create a category by admin', async () => {
        const createCategoryDto = {
            name: 'Admin Created Category',
            expense_type: ExpenseType.Expenses,
            image_url: 'http://example.com/image.png',
            percentage: 50,
        };

        const response = await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(createCategoryDto)
            .expect(201);

        createdCategoryId = response.body.id;
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(createCategoryDto.name);
    });

    it('POST /categories should create a category by user', async () => {
        const createCategoryDto = {
            name: 'User Created Category',
            expense_type: ExpenseType.Income,
            image_url: 'http://example.com/image.png',
            percentage: 60,
        };

        const response = await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${userToken}`)
            .send(createCategoryDto)
            .expect(201);

        createdCategoryId = response.body.id;
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(createCategoryDto.name);
    });

    it('GET /categories should create a category by admin', async () => {
      const createCategoryDto = {
          name: 'Admin Created Category',
          expense_type: ExpenseType.Expenses,
          image_url: 'http://example.com/image.png',
          percentage: 50,
      };

      await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(createCategoryDto)
          .expect(201);

      const response = await request(app.getHttpServer())
          .get('/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(createCategoryDto)
          .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
  });

    it('PUT /categories/:id should update a category', async () => {
        const createCategoryDto = {
            name: 'Update Category',
            expense_type: ExpenseType.Expenses,
            image_url: 'http://example.com/image.png',
        };

        const categoryResponse = await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(createCategoryDto)
            .expect(201);

        const updateCategoryDto = {
            name: 'Updated Category Name',
            expense_type: ExpenseType.Income,
            image_url: 'http://example.com/new-image.png',
        };

        const updateResponse = await request(app.getHttpServer())
            .put(`/categories/${categoryResponse.body.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateCategoryDto)
            .expect(200);

        expect(updateResponse.body.name).toBe(updateCategoryDto.name);
        expect(updateResponse.body.expense_type).toBe(updateCategoryDto.expense_type);
    });

    it('DELETE /categories/:id should delete a category by admin', async () => {
        const createCategoryDto = {
            name: 'Delete Me Category',
            expense_type: ExpenseType.Expenses,
            image_url: 'http://example.com/image.png',
        };

        const categoryResponse = await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(createCategoryDto)
            .expect(201);

        const deleteResponse = await request(app.getHttpServer())
            .delete(`/categories/delete/${categoryResponse.body.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(deleteResponse.text).toMatch(/Категория с id \d+ удалена/);  // Заменено на более общий шаблон
    });

    it('POST /categories/assign should throw NOT_FOUND if category does not exist', async () => {
        const assignResponse = await request(app.getHttpServer())
            .post('/categories/assign')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                category_id: 999,
                percentage: 20,
            })
            .expect(404);
        
        expect(assignResponse.body.message).toBe('Категория не найдена');
    });

    it('POST /categories/assign should return BAD_REQUEST for already assigned category', async () => {
        const createCategoryDto = {
            name: 'Assign Category',
            expense_type: ExpenseType.Expenses,
            image_url: 'http://example.com/image.png',
        };

        const categoryResponse = await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(createCategoryDto)
            .expect(201);

        const assignDto = {
            category_id: categoryResponse.body.id,
            percentage: 60,
        };

        await request(app.getHttpServer())
            .post('/categories/assign')
            .set('Authorization', `Bearer ${userToken}`)
            .send(assignDto)
            .expect(400); // Повторное назначение должно выбросить BAD_REQUEST
    });
});

describe('GoalsController (e2e)', () => {
  let app: INestApplication;
  let goalsService: GoalsService;
  let jwtService: JwtService;
  let adminToken: string;
  let userToken: string;
  let userId: number;
  let budgetId: number;
  let goalId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    goalsService = moduleFixture.get<GoalsService>(GoalsService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();

    // Регистрация администратора и пользователя
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'admin@example.com', password: 'adminpassword', username: 'adminuser' })
      .expect(201);
    adminToken = adminResponse.body.token;

    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'testuser@example.com', password: 'password', username: 'testuser' })
      .expect(201);
    userToken = userResponse.body.token;

    // Получаем ID пользователя из токена
    const decodedToken: any = jwtService.decode(userToken);
    userId = decodedToken.id;

    // Создаем категорию
    const category = await Category.create({
      name: 'Test Category',
      expense_type: ExpenseType.Expenses,
      image_url: 'http://example.com/image.png',
    });

    // Создаем связь между пользователем и категорией
    const userCategory = await UserCategory.create({
      user_id: userId,
      category_id: category.id,
      percentage: 50,
    });

    // Создаем бюджет для тестов
    const budget = await Budget.create({
      amount: 1000,
      owner_id: userCategory.id, // Используем ID из user-categories
    });
    budgetId = budget.id;
  });

  afterEach(async () => {
    // Удаляем созданные цели после каждого теста
    if (goalId) {
      await request(app.getHttpServer())
        .delete(`/goals/delete/${goalId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /goals', () => {
    it('should create a new goal', async () => {
      const createGoalDto: CreateGoalDto = {
        name: 'Test Goal',
        target_amount: 1000,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Завтрашняя дата
        budget_id: budgetId, // Используем созданный бюджет
      };

      const response = await request(app.getHttpServer())
        .post('/goals')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createGoalDto)
        .expect(201);

      goalId = response.body.id; // Сохраняем ID созданной цели
      expect(response.body.name).toBe(createGoalDto.name);
      expect(response.body.target_amount).toBe(createGoalDto.target_amount);
    });

    it('should return 404 if budget does not exist', async () => {
      const createGoalDto: CreateGoalDto = {
        name: 'Test Goal',
        target_amount: 1000,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        budget_id: 999, // Несуществующий бюджет
      };

      await request(app.getHttpServer())
        .post('/goals')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createGoalDto)
        .expect(404);
    });
  });

  describe('GET /goals', () => {
    it('should return 403 for user', async () => {
      await request(app.getHttpServer())
        .get('/goals')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
    
    it('should return goals for admin', async () => {
        const newAdminToken = jwtService.sign({ id: 1, role: Role.Admin });
        const response = await request(app.getHttpServer())
          .get('/goals')
          .set('Authorization', `Bearer ${newAdminToken}`)
          .expect(200);
  
        expect(Array.isArray(response.body)).toBeTruthy();
      });
  });

  describe('GET /goals/user', () => {
    it('should retrieve goals for the authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/goals/user')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
    });
  });

  describe('PUT /goals/:id', () => {
    it('should update an existing goal', async () => {
      // Создаем цель для обновления
      const createGoalDto: CreateGoalDto = {
        name: 'Test Goal',
        target_amount: 1000,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        budget_id: budgetId,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/goals')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createGoalDto)
        .expect(201);
      goalId = createResponse.body.id;

      const updateGoalDto = {
        name: 'Updated Goal',
        target_amount: 1500,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        budget_id: budgetId,
      };

      const response = await request(app.getHttpServer())
        .put(`/goals/${goalId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateGoalDto)
        .expect(200);

      expect(response.body.name).toBe(updateGoalDto.name);
      expect(response.body.target_amount).toBe(updateGoalDto.target_amount);
    });

    it('should return 404 if goal does not exist', async () => {
      const updateGoalDto = {
        name: 'Updated Goal',
        target_amount: 1500,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        budget_id: budgetId,
      };

      const response = await request(app.getHttpServer())
        .put(`/goals/${999}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateGoalDto)
        .expect(404);
    });

    it('should return 403 if goal does not belong to user', async () => {
      // Создаем цель для обновления
      const createGoalDto: CreateGoalDto = {
        name: 'Test Goal',
        target_amount: 1000,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        budget_id: budgetId,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/goals')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createGoalDto)
        .expect(201);
      goalId = createResponse.body.id;

      const updateGoalDto = {
        name: 'Updated Goal',
        target_amount: 1500,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        budget_id: budgetId,
      };

      const newToken = jwtService.sign({id:5, role: Role.User});
      const response = await request(app.getHttpServer())
        .put(`/goals/${goalId}`)
        .set('Authorization', `Bearer ${newToken}`)
        .send(updateGoalDto)
        .expect(403);
    });
  });

  describe('DELETE /goals/:id', () => {
    it('should delete an existing goal', async () => {
      // Создаем цель для удаления
      const createGoalDto: CreateGoalDto = {
        name: 'Test Goal',
        target_amount: 1000,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        budget_id: budgetId,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/goals')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createGoalDto)
        .expect(201);
      goalId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/goals/delete/${goalId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Проверяем, что цель удалена
      const getResponse = await request(app.getHttpServer())
        .get('/goals/user')
        .set('Authorization', `Bearer ${userToken}`);
      expect(getResponse.body.find((goal) => goal.id === goalId)).toBeUndefined();
    });
  });
});

describe('BudgetController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let budgetService: BudgetService;
  let createdCategoryId: number;
  let category: Category;
  let userCategory: UserCategory;
  let createdUserCategoryId: number;
  let userId: number;
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    budgetService = moduleFixture.get<BudgetService>(BudgetService);
    await app.init();

    // Регистрация администратора
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'admin@example.com', password: 'adminpassword', username: 'adminuser' })
      .expect(201);
    adminToken = adminResponse.body.token;

    // Регистрация пользователя
    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'testuser@example.com', password: 'password', username: 'testuser' })
      .expect(201);
    userToken = userResponse.body.token;

    // Получаем ID пользователя из токена
    const decodedToken: any = jwtService.decode(userToken);
    userId = decodedToken.id;

    // Создаем категорию
    category = await Category.create({
      name: 'Test Category',
      expense_type: ExpenseType.Expenses,
      image_url: 'http://example.com/image.png',
    });
    createdCategoryId = category.id;

    // Создаем пользовательскую категорию
    userCategory = await UserCategory.create({
      user_id: userId,
      category_id: createdCategoryId,
      percentage: 50,
    });
    createdUserCategoryId = userCategory.id;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Очистка данных после каждого теста
    if (createdCategoryId) {
      await request(app.getHttpServer())
        .delete(`/categories/delete/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }

  });

  describe('POST /budgets', () => {
    it('should create a new budget', async () => {
      const createBudgetDto = { category_id: createdCategoryId, amount: 1000 };

      const response = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createBudgetDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.category_name).toBe('Test Category');
      expect(response.body.amount).toBe(1000);
    });

    it('should return 404 if category not found', async () => {
      const createBudgetDto = { category_id: 999, amount: 1000 };

      const response = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createBudgetDto)
        .expect(404);

      expect(response.body.message).toBe('Категория не найдена');
    });

    it('should return 404 if user category not found', async () => {
        let newCategoryId;
        // Создаем категорию
      const category = await Category.create({
        name: 'Test Category',
        expense_type: ExpenseType.Expenses,
        image_url: 'http://example.com/image.png',
      });
      newCategoryId = category.id;

      const createBudgetDto = { category_id: newCategoryId, amount: 1000 };

      const response = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createBudgetDto)
        .expect(404);

      expect(response.body.message).toBe('Пользователь не указал процент трат категории');
    });

    it('should return 400 if budget already exists', async () => {
        
      const createBudgetDto = { category_id: createdCategoryId, amount: 1000 };

      const response_1 = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createBudgetDto)
        .expect(201);

      // Пытаемся создать второй бюджет для той же категории
      const response = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createBudgetDto)
        .expect(400);

      expect(response.body.message).toBe('Счет для данной категории уже существует');
    });
  });

  describe('GET /budgets', () => {
    it('should return user budgets', async () => {
      const createBudgetDto = { category_id: createdCategoryId, amount: 1000 };

      // Создаем бюджет
      await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createBudgetDto)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/budgets')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('category_name', 'Test Category');
      expect(response.body[0]).toHaveProperty('amount', 1000);
    });
  });

  describe('PUT /budgets', () => {
    it('should update budget amount', async () => {
      const createBudgetDto = { category_id: createdCategoryId, amount: 1000 };

      // Создаем бюджет
      const budgetResponse = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createBudgetDto)
        .expect(201);

      const updateBudgetDto = { category_id: createdCategoryId, amount: 1500 };

      const response = await request(app.getHttpServer())
        .put('/budgets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateBudgetDto)
        .expect(200);

      expect(response.body.amount).toBe(1500);
      expect(response.body.category_name).toBe('Test Category');
    });

    it('should return 404 if category not found', async () => {
      
      const updateBudgetDto = { category_id: 999, amount: 1500 };

      const response = await request(app.getHttpServer())
        .put('/budgets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateBudgetDto)
        .expect(404);

      expect(response.body.message).toBe('Категория не найдена');
    });

    it('should return 404 if budget not found', async () => {
        let newCategoryId;
        // Создаем категорию
      const category = await Category.create({
        name: 'Test Category',
        expense_type: ExpenseType.Expenses,
        image_url: 'http://example.com/image.png',
      });
      newCategoryId = category.id;
      const newUserCategory = await UserCategory.create({
        user_id: userId,
        category_id: newCategoryId,
        percentage: 50,
      });

      const createBudgetDto = { category_id: newCategoryId, amount: 1000 };

      const response = await request(app.getHttpServer())
        .put('/budgets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createBudgetDto)
        .expect(404);

      expect(response.body.message).toBe('Счет для данной категории не найден');
    });
    
    it('should return 404 if user category not found', async () => {
      let newCategoryId;
      // Создаем категорию
    const category = await Category.create({
      name: 'Test Category',
      expense_type: ExpenseType.Expenses,
      image_url: 'http://example.com/image.png',
    });
    newCategoryId = category.id;

    const createBudgetDto = { category_id: newCategoryId, amount: 1000 };

    const response = await request(app.getHttpServer())
      .put('/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send(createBudgetDto)
      .expect(404);

    expect(response.body.message).toBe('Пользователь не указал процент трат категории');
  });
  });

  describe('DELETE /budgets/:id', () => {
    it('should delete a budget', async () => {
      const createBudgetDto = { category_id: createdCategoryId, amount: 1000 };

      // Создаем бюджет
      const budgetResponse = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createBudgetDto)
        .expect(201);

      const response = await request(app.getHttpServer())
        .delete(`/budgets/${budgetResponse.body.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toEqual({ message: `Счет ${budgetResponse.body.id} успешно удалён` });
    });

    it('should return 404 if budget not found', async () => {
      const response = await request(app.getHttpServer())
        .delete('/budgets/999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.message).toBe('Счет не найден');
    });

    it("should return 403 if user tries to delete someone else's budget", async () => {
      const createBudgetDto = { category_id: createdCategoryId, amount: 1000 };
      const newToken =  jwtService.sign({ id: 999, role: Role.Admin });
      // Создаем бюджет от имени администратора
      const budgetResponse = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createBudgetDto)
        .expect(201);

      // Пытаемся удалить бюджет от имени другого пользователя
      const response = await request(app.getHttpServer())
        .delete(`/budgets/${budgetResponse.body.id}`)
        .set('Authorization', `Bearer ${newToken}`)
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
});