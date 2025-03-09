import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../enums/roles.enum';
import { RolesGuard } from './roles.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { HttpException, HttpStatus, ExecutionContext } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockJwtService: Partial<JwtService>;
  let mockReflector: Partial<Reflector>;

  beforeEach(() => {
    mockJwtService = {
      verify: jest.fn(),
    };

    mockReflector = {
      get: jest.fn(),
    };

    guard = new RolesGuard(
      mockReflector as Reflector,
      mockJwtService as JwtService,
    );
  });

  it('should restrict access for non-admin users', () => {
    // Мокаем роли
    mockReflector.get = jest.fn().mockReturnValue([Role.Admin]);

    // Мокаем JWT с пользователем с ролью "User"
    mockJwtService.verify = jest.fn().mockReturnValue({ id: 1, role: Role.User });

    // Создаем контекст
    const context = {
      getHandler: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer valid-token' },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(
      new HttpException('Нет доступа', HttpStatus.FORBIDDEN),
    );
  });

  it('should allow access for admin users', () => {
    // Мокаем роли
    mockReflector.get = jest.fn().mockReturnValue([Role.Admin]);

    // Мокаем JWT с пользователем с ролью "Admin"
    mockJwtService.verify = jest.fn().mockReturnValue({ id: 1, role: Role.Admin });

    // Создаем контекст
    const context = {
      getHandler: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer valid-token' },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if token is invalid', () => {
    mockReflector.get = jest.fn().mockReturnValue([Role.Admin]);

    // Мокаем недействительный токен
    mockJwtService.verify = jest.fn().mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const context = {
      getHandler: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer invalid-token' },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(
      new HttpException('Невалидный токен', HttpStatus.UNAUTHORIZED),
    );
  });

  it('should grant access when no roles are defined', () => {
    mockReflector.get = jest.fn().mockReturnValue(undefined);

    mockJwtService.verify = jest.fn().mockReturnValue({ id: 1, role: Role.User });

    const context = {
      getHandler: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer valid-token' },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  
  it('should deny access if no authorization header is present', () => {
    const context = {
      getHandler: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(
      new HttpException('Пользователь не авторизован', HttpStatus.UNAUTHORIZED),
    );
  });

  it('should throw UNAUTHORIZED error if token is not Bearer', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'InvalidTokenFormat token123',
          },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(
      new HttpException('Пользователь не авторизован', HttpStatus.UNAUTHORIZED),
    );
  });
});