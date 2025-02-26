import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../enums/roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<Role[]>('roles', context.getHandler());
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

    if (!roles) {
      return true; // Разрешить доступ, если роли не указаны
    }
    //проверка ролей
    if (!roles.includes(user.role)) {
      throw new HttpException('Нет доступа', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}