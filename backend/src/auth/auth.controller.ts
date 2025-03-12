import { Body, Controller, Post, Put, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dto/create-user-dto';
import { AuthService } from './auth.service';
import { TokenResponseDto } from './dto/token-responce-dto';
import { LoginDto } from './dto/login-dto';
import { User } from 'src/database/models/users.model';
import { IdGuard } from '../common/guards/auth.guard';
import { UpdateUserDto } from './dto/update-user-dto';

@ApiTags('Авторизация')
@Controller('auth')
export class AuthController {
    
    constructor(private authService: AuthService) {}

    @ApiOperation({summary: 'Авторизация пользователя'})
    @ApiResponse({ status: 201, description: 'Пользователь успешно авторизован', type: TokenResponseDto })
    @ApiResponse({ status: 401, description: 'Неправильный email или пароль' })
    @Post('/login')
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }
    
    @ApiOperation({summary: 'Регистрация пользователя'})
    @ApiResponse({ status: 201, description: 'Пользователь успешно зарегистрирован', type: TokenResponseDto })
    @ApiResponse({ status: 400, description: 'Пользователь с таким email уже зарегистрирован' })
    @Post('/register')
    register(@Body() registerDto: CreateUserDto) {
        return this.authService.register(registerDto);
    }
    
    @ApiOperation({ summary: 'Обновление пользователя' })
    @ApiResponse({ status: 200, description: 'Пользователь успешно обновлен', type: User })
    @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
    @ApiResponse({ status: 404, description: 'Пользователь не найден' })
    @UseGuards(IdGuard)
    @ApiBearerAuth()
    @Put()
    async updateUser(@Body() updateUserDto: UpdateUserDto, @Request() req) {
        const userId = req.user.id;  // Получение userId из JWT токена
        return this.authService.updateUser(updateUserDto, userId);
    }
}