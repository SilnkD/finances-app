import { Test, TestingModule } from '@nestjs/testing';
import { IdGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { HttpException, HttpStatus, ExecutionContext } from '@nestjs/common';

describe('IdGuard', () => {
  let guard: IdGuard;
  let mockJwtService: Partial<JwtService>;
  let mockReflector: Partial<Reflector>;

  beforeEach(() => {
    mockJwtService = {
      verify: jest.fn(),
    };

    mockReflector = {
      get: jest.fn(),
    };

    guard = new IdGuard(mockReflector as Reflector, mockJwtService as JwtService);
  });

  it('should allow access if no userId is defined in reflector', () => {
    mockReflector.get = jest.fn().mockReturnValue(undefined);
    mockJwtService.verify = jest.fn().mockReturnValue({ id: 1 });

    const context = {
      getHandler: jest.fn().mockReturnValue('test-handler'),
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
      getHandler: jest.fn().mockReturnValue('test-handler'),
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
      getHandler: jest.fn().mockReturnValue('test-handler'),
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

  it('should deny access if token is invalid', () => {
    mockJwtService.verify = jest.fn().mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const context = {
      getHandler: jest.fn().mockReturnValue('test-handler'),
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

  it('should allow access if userId matches token user id', () => {
    mockReflector.get = jest.fn().mockReturnValue(1);
    mockJwtService.verify = jest.fn().mockReturnValue({ id: 1 });

    const context = {
      getHandler: jest.fn().mockReturnValue('test-handler'),
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer valid-token' },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if userId does not match token user id', () => {
    mockReflector.get = jest.fn().mockReturnValue(2);
    mockJwtService.verify = jest.fn().mockReturnValue({ id: 1 });

    const context = {
      getHandler: jest.fn().mockReturnValue('test-handler'),
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
});