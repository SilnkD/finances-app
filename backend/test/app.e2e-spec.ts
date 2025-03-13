import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/common/enums/roles.enum';
import { UsersService } from 'src/users/users.service';

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

    it('/auth/register (POST) should register a user and return a token', async () => {
        const registerDto = { email: 'test@example.com', password: 'password', username: 'user' };
        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send(registerDto)
            .expect(201);

        expect(response.body).toHaveProperty('token');
    });

    it('/auth/register (POST) should return BAD_REQUEST if user already exists', async () => {
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

    it('/auth/login (POST) should return a token if credentials with email are valid', async () => {
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

    it('/auth/login (POST) should return a token if credentials with username are valid', async () => {
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

    it('/auth/login (POST) should return UNAUTHORIZED for invalid username/password', async () => {
        const loginDto = { user: 'invaliduser', password: 'wrongpassword' };
        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send(loginDto)
            .expect(401);

        expect(response.body.message).toBe('Неправильный email или пароль');
    });
    
    it('/auth (PUT) should update a user and return updated user data', async () => {
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

    it('/auth (PUT) should return NOT_FOUND if user does not exist', async () => {
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

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],  // Ensure UserCategoryModule is included in AppModule
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

    it('/categories/:id (DELETE) should return NOT_FOUND if category is not found', async () => {
        const categoryId = 999; // Non-existing ID
        const token = jwtService.sign({ id: 1, role: Role.Admin });

        await request(app.getHttpServer())
            .delete(`/categories/${categoryId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });

    it('/categories/:id (PUT) should update a category for an admin', async () => {
        const categoryId = 1;
        const category = { name: 'New Category', expense_type: 'EXPENSE', image_url: 'http://example.com/image.png', percentage: 50 };
        const updateCategoryDto = { name: 'Updated Category', expense_type: 'EXPENSE', image_url: 'http://example.com/image.png', percentage: 75 };
        const token = jwtService.sign({ id: 1, role: Role.Admin });

        await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${token}`)
            .send(category)
            .expect(201);

        const response = await request(app.getHttpServer())
            .put(`/categories/${categoryId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateCategoryDto)
            .expect(200);

        expect(response.body).toHaveProperty('id', categoryId);
        expect(response.body).toHaveProperty('name', updateCategoryDto.name);
    });

});


/*
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

    it('/budgets (GET) should return user budgets', async () => {
        const token = jwtService.sign({ id: 1 });

        const response = await request(app.getHttpServer())
            .get('/budgets')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
    });

    it('/budgets/:id (DELETE) should return error if budget not found', async () => {
        const token = jwtService.sign({ id: 1 });

        await request(app.getHttpServer())
            .delete('/budgets/999')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });
});
*/