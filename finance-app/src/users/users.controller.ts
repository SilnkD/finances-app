import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user-dto';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from './users.model';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { Role } from '../roles/roles.enum';
import { AssignRoleDto } from './dto/assign-role-dto';

@ApiTags('Пользователи')
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {

    constructor (private usersService: UsersService) {}

    @ApiOperation({summary: 'Создание объекта'})
    @ApiResponse({status: 200, type: User}) //код запроса и тип данных, которые возвращаются
    @Post()
    create(@Body() userDto: CreateUserDto) {
        return this.usersService.createUser(userDto);
    }

    @ApiOperation({summary: 'ADMIN/Назначение роли'})
    @ApiResponse({status: 200, type: User})
    @Roles(Role.Admin)
    @Get('admin')
    assignRole(@Body() roleDto:AssignRoleDto) {
        return this.usersService.assignRole(roleDto);
    }

    @ApiOperation({summary: 'ADMIN/Получение всех пользователей'})
    @ApiResponse({status: 200, type: [User]}) //массив пользователей
    @Roles(Role.Admin)
    @Get('admin')
    getAll() {
        return this.usersService.getAllUsers();
    }
}