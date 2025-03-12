import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/common/enums/roles.enum';

describe('AuthController (e2e)', () => {
      let app: INestApplication;
      let jwtService: JwtService;

      // Моки сервисов
      let authService = { 
          login: jest.fn(), 
          register: jest.fn(), 
          updateUser: jest.fn(),
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