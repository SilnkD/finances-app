import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/common/enums/roles.enum';

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let jwtService: JwtService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        jwtService = moduleFixture.get<JwtService>(JwtService);
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('/auth/register (POST) should register a user and return a token', async () => {
        const registerDto = { email: 'test@example.com', password: 'password', username: 'user' };
        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send(registerDto)
            .expect(201);

        expect(response.body).toHaveProperty('token'); // Adjust based on actual response
    });

    it('/auth/login (POST) should return a token', async () => {
        const loginDto = { user: 'test@example.com', password: '123456' };
        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send(loginDto)
            .expect(201);

        expect(response.body).toHaveProperty('token'); // Adjust based on actual response
    });

    it('/auth (PUT) should update a user and return updated user data', async () => {
        const updateUserDto = { username: 'newUser', password: 'newPassword' };
        const token = jwtService.sign({ id: 1, email: 'test@example.com', role: Role.User });

        const response = await request(app.getHttpServer())
            .put('/auth')
            .set('Authorization', `Bearer ${token}`)
            .send(updateUserDto)
            .expect(200);

        expect(response.body).toHaveProperty('username', 'newUser'); // Adjust based on actual response
    });
});

describe('CategoriesController (e2e)', () => {
    let app: INestApplication;
    let jwtService: JwtService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        jwtService = moduleFixture.get<JwtService>(JwtService);
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('/categories (POST) should create a category and return the created category', async () => {
        const createCategoryDto = { name: 'New Category', expense_type: 'EXPENSE', image_url: 'http://example.com/image.png', percentage: 50 };
        const token = jwtService.sign({ id: 1, role: Role.Admin });

        const response = await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${token}`)
            .send(createCategoryDto)
            .expect(201);

        expect(response.body).toHaveProperty('id'); // Check for actual properties
    });

    it('/categories (GET) should return categories for user', async () => {
        const token = jwtService.sign({ id: 1, role: Role.User });

        const response = await request(app.getHttpServer())
            .get('/categories')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true); // Assuming categories return as an array
    });
});

describe('UsersController (e2e)', () => {
    let app: INestApplication;
    let jwtService: JwtService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        jwtService = moduleFixture.get<JwtService>(JwtService);
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('/users/assign-role (POST) should assign a role to a user', async () => {
        const roleDto = { id: 1, role: Role.Admin };
        const token = jwtService.sign({ id: 1, role: Role.Admin });

        const response = await request(app.getHttpServer())
            .post('/users/assign-role')
            .set('Authorization', `Bearer ${token}`)
            .send(roleDto)
            .expect(201);

        expect(response.body).toHaveProperty('role', Role.Admin);
    });

    it('/users/delete/:id (DELETE) should delete a user and return success message', async () => {
        const token = jwtService.sign({ id: 1, role: Role.Admin });

        const response = await request(app.getHttpServer())
            .delete('/users/delete/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body).toHaveProperty('message', 'User with id 1 deleted.');
    });

    it('/users/delete/:id (DELETE) should throw error if user not found', async () => {
        const token = jwtService.sign({ id: 1, role: Role.Admin });

        await request(app.getHttpServer())
            .delete('/users/delete/999')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });
});

describe('BudgetController (e2e)', () => {
    let app: INestApplication;
    let jwtService: JwtService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        jwtService = moduleFixture.get<JwtService>(JwtService);
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('/budgets (POST) should create a new budget', async () => {
        const createBudgetDto = { category_id: 1, amount: 1000 };
        const token = jwtService.sign({ id: 1 });

        const response = await request(app.getHttpServer())
            .post('/budgets')
            .set('Authorization', `Bearer ${token}`)
            .send(createBudgetDto)
            .expect(201);

        expect(response.body).toHaveProperty('id'); // Adjust based on actual properties
    });

    it('/budgets (GET) should return user budgets', async () => {
        const token = jwtService.sign({ id: 1 });

        const response = await request(app.getHttpServer())
            .get('/budgets')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true); // Assuming budgets return as an array
    });

    it('/budgets/:id (DELETE) should delete a budget and return a success message', async () => {
        const token = jwtService.sign({ id: 1 });

        const response = await request(app.getHttpServer())
            .delete('/budgets/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body).toHaveProperty('message', 'Budget successfully deleted'); // Adjust based on actual output
    });

    it('/budgets/:id (DELETE) should return error if budget not found', async () => {
        const token = jwtService.sign({ id: 1 });

        await request(app.getHttpServer())
            .delete('/budgets/999')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });
});