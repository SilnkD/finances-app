import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user-dto';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from './users.model';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../roles/roles.enum';
import { AssignRoleDto } from './dto/assign-role-dto';

@ApiTags('Пользователи')
@Controller('users')
export class UsersController {

    constructor(private usersService: UsersService) {}

    @ApiOperation({summary: 'Создание объекта'})
    @ApiResponse({status: 200, type: User})
    @Post()
    create(@Body() userDto: CreateUserDto) {
        return this.usersService.createUser(userDto);
    }

    @ApiOperation({summary: 'ADMIN/Назначение роли'})
    @ApiResponse({status: 200, type: User})
    @UseGuards(RolesGuard)
    @Post('assign-role')
    assignRole(@Body() roleDto: AssignRoleDto) {
        return this.usersService.assignRole(roleDto);
    }

    @ApiOperation({summary: 'ADMIN/Получение всех пользователей'})
    @ApiResponse({status: 200, type: [User]})
    @Roles(Role.Admin)
    @UseGuards(RolesGuard)
    @Get('all')
    getAll() {
        return this.usersService.getAllUsers();
    }
}