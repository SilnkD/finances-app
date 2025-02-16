import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user-dto';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from './users.model';

@ApiTags('Пользователи')
@Controller('users')
export class UsersController {

    constructor (private usersService: UsersService) {}

    @ApiOperation({summary: 'Создание объекта'})
    @ApiResponse({status: 200, type: User}) //код запроса и тип данных, которые возвращаются
    @Post()
    create(@Body() userDto: CreateUserDto) {
        return this.usersService.createUser(userDto);
    }

    @ApiOperation({summary: 'Получение всех пользователей'})
    @ApiResponse({status: 200, type: [User]}) //массив пользователей
    @Get()
    getAll() {
        return this.usersService.getAllUsers();
    }
}
