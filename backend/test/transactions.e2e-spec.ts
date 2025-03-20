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