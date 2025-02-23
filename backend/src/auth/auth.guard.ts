import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class IdGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const userId = this.reflector.get<number>('id', context.getHandler());
    //проверка авторизации пользователя
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
        throw new HttpException('Пользователь не авторизован', HttpStatus.UNAUTHORIZED);
    }

    const bearer = authHeader.split(' ')[0];
    const token = authHeader.split(' ')[1];

    if (bearer !== 'Bearer' || !token) {
        throw new HttpException('Пользователь не авторизован', HttpStatus.UNAUTHORIZED);
    }

    let user;
    try {
      user = this.jwtService.verify(token);
    } catch (e) {
        throw new HttpException('Невалидный токен', HttpStatus.UNAUTHORIZED);
    }

    request.user = user;

    if (!userId) {
      return true; // Разрешить доступ, если id не указаны
    }

    if (userId != user.id) {
      throw new HttpException('Нет доступа', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}