import { Body, Controller, Post, Put, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dto/create-user-dto';
import { AuthService } from './auth.service';
import { TokenResponseDto } from './dto/token-responce-dto';
import { LoginDto } from './dto/login-dto';
import { User } from 'src/users/users.model';
import { IdGuard } from './auth.guard';

@ApiTags('Авторизация')
@Controller('auth')
export class AuthController {
    
    constructor (private authService: AuthService) {}

    @ApiOperation({summary: 'Авторизация пользователя'})
    @ApiResponse({status: 200, type: TokenResponseDto}) //код запроса и тип данных, которые возвращаются
    @Post('/login')
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }
    
    @ApiOperation({summary: 'Регистрация пользователя'})
    @ApiResponse({status: 200, type: TokenResponseDto}) //код запроса и тип данных, которые возвращаются
    @Post('/register')
    register(@Body() registerDto: CreateUserDto) {
        return this.authService.register(registerDto);
    }
    
    @ApiOperation({ summary: 'Обновление пользователя' })
    @ApiResponse({ status: 200, type: User })
    @UseGuards(IdGuard)
    @ApiBearerAuth()
    @Put()
    async updateUser(@Body() updateUserDto: CreateUserDto, @Request() req) {
        const userId = req.user.id;  // Получение userId из JWT токена
        return this.authService.updateUser(updateUserDto, userId);
    }
}
