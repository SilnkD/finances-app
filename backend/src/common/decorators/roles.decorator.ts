import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/roles/roles.enum';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
//@Roles(Role.Admin) используется в контроллере для ограничения доступа по роли пользователя