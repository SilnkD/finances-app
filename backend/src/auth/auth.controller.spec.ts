import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';
import { IdGuard } from 'src/common/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Role } from 'src/common/enums/roles.enum';
import { CreateUserDto } from 'src/users/dto/create-user-dto';
import { UpdateUserDto } from './dto/update-user-dto';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    updateUser: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn().mockReturnValue({ id: 1, role: Role.Admin }), // Замоканный метод верификации JWT
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: Reflector, useValue: { get: jest.fn() } },
        IdGuard,
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should login user', async () => {
    const dto: LoginDto = {
      user: 'username',
      password: 'password',
    };
    mockAuthService.login.mockResolvedValue({
      token: 'Test Token',
    });

    const result = await authController.login(dto);

    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ token: 'Test Token' });
  });

  it('should throw error when authorizing with invalid data', async () => {
    const dto: LoginDto = {
        user: '',
        password: '',
    };
    mockAuthService.login.mockRejectedValue(
      new HttpException('Неправильный email или пароль', HttpStatus.UNAUTHORIZED),
    );

    await expect(authController.login(dto)).rejects.toThrow(
      'Неправильный email или пароль',
    );
  });

  it('should register user', async () => {
    const dto: CreateUserDto = {
      username: 'username',
      email: 'email@gmail.com',
      password: 'password',
    };
    mockAuthService.register.mockResolvedValue({
      token: 'Test Token',
    });

    const result = await authController.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ token: 'Test Token' });
  });

  it('should throw error when user registers with invalid data', async () => {
    const dto: CreateUserDto = {
        username: '',
        email: '',
        password: '',
    };
    mockAuthService.register.mockRejectedValue(
        new HttpException('Invalid data', HttpStatus.BAD_REQUEST),
    );

    await expect(authController.register(dto)).rejects.toThrow(
      'Invalid data',
    );
  });

  it('should update user information', async () => {
    const dto: UpdateUserDto = {
      username: 'username',
      password: 'password',
    };
    const req = { user: { id: 1 } };
    mockAuthService.updateUser.mockResolvedValue({
      id: 1,
      name: 'Updated User',
    });

    const result = await authController.updateUser(dto, req);

    expect(authService.updateUser).toHaveBeenCalledWith(dto, 1);
    expect(result).toEqual({ id: 1, name: 'Updated User' });
  });

  it('should throw error when updating non-existent user', async () => {
    const dto: UpdateUserDto = {
        username: '',
        password: '',
    };
    const req = { user: { id: 1 } };
    mockAuthService.updateUser.mockRejectedValue(
      new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND),
    );

    await expect(
      authController.updateUser(dto, req),
    ).rejects.toThrow('Пользователь не найден');
  });
  
});