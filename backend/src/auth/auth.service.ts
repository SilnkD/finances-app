import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user-dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/users/users.model';
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
        const hashPassword = await bcrypt.hash(registerDto.password, 5);
        const user = await this.userService.createUser({...registerDto, password:hashPassword}) // dto с измененным паролем
        return this.generateToken(user);
    }

    
    async updateUser(dto: UpdateUserDto, id: number) {
        const hashPassword = await bcrypt.hash(dto.password, 5);
        const username = dto.username;
        await this.userService.updateUser(username, hashPassword, id );
        const user = await this.userService.getUserById(id);
        return user;
    }
    
    generateToken (user: User) {
        const payload = {id: user.id, email: user.email, role: user.role};
        return {
            token: this.jwtService.sign(payload)
        };
    }
}