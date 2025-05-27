import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user-dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/database/models/users.model';
import { LoginDto } from './dto/login-dto';
import { UpdateUserDto } from './dto/update-user-dto';

@Injectable()
export class AuthService {

    constructor(private userService: UsersService,
                private jwtService: JwtService) {}
    
    async login(loginDto: LoginDto) {
        const user_by_email = await this.userService.getUsersByEmail(loginDto.user);
        const user_by_name = await this.userService.getUsersByName(loginDto.user);
        if (user_by_email && await bcrypt.compare(loginDto.password, user_by_email.password)) {
            return this.generateToken(user_by_email);
        } else if (user_by_name && await bcrypt.compare(loginDto.password, user_by_name.password)) {
            return this.generateToken(user_by_name);
        }
        throw new HttpException('Неправильный email или пароль', HttpStatus.UNAUTHORIZED);
    }

    async register(registerDto: CreateUserDto) {
        const candidate = await this.userService.getUsersByEmail(registerDto.email);
        if (candidate) {
            throw new HttpException('Пользователь с таким email уже зарегистрирован', HttpStatus.BAD_REQUEST);
        }
        console.log(registerDto.password);
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(registerDto.password, salt);
        console.log(hashPassword);

        const user = await this.userService.createUser({...registerDto, password: hashPassword}); // dto с измененным паролем
        return this.generateToken(user);
    }

    
    async updateUser(dto: UpdateUserDto, id: number) {
        const user = await this.userService.getUserById(id);
        if (!user) {
            throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
        }
        const hashPassword = await bcrypt.hash(dto.password, 5);
        const updatedData = { ...dto, password: hashPassword };
        await this.userService.updateUser(updatedData.username, updatedData.password, id);
        return this.userService.getUserById(id);
    }
    
    generateToken(user: User) {
        const payload = { id: user.id, email: user.email, role: user.role };
        return {
            token: this.jwtService.sign(payload)
        };
    }
}
