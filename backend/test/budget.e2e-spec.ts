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