import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user-dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/users/users.model';

@Injectable()
export class AuthService {

    constructor(private userService: UsersService,
                private jwtService: JwtService) {}
    
    async login(loginDto: CreateUserDto) {
        const user = await this.userService.getUsersByEmail(loginDto.email);
        if (user && await bcrypt.compare(loginDto.password, user.password)) {
            return this.generateToken(user);
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

    generateToken (user: User) {
        const payload = {id: user.id, email: user.email, role: user.role};
        return {
            token: this.jwtService.sign(payload)
        };
    }
}