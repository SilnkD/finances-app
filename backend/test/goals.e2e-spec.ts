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