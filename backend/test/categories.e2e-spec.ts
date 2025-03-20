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