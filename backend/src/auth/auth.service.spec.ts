import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { HttpException, HttpStatus } from '@nestjs/common';
import { LoginDto } from './dto/login-dto';
import { CreateUserDto } from 'src/users/dto/create-user-dto';
import { UpdateUserDto } from './dto/update-user-dto';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
    let authService: AuthService;
    let userService: UsersService;
    let jwtService: JwtService;

    const mockUserService = {
        getUsersByEmail: jest.fn(),
        getUsersByName: jest.fn(),
        createUser: jest.fn(),
        getUserById: jest.fn(),
        updateUser: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn().mockReturnValue('token'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: mockUserService },
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        userService = module.get<UsersService>(UsersService);
        jwtService = module.get<JwtService>(JwtService);
    });

    describe('login', () => {
        it('should return a token if credentials with email are valid', async () => {
            const loginDto: LoginDto = { user: 'test@example.com', password: 'password' };
            const mockUser = { id: 1, email: 'test@example.com', username: undefined, password: await bcrypt.hash('password', 5), role: 'user' };

            mockUserService.getUsersByEmail.mockResolvedValue(mockUser);
            mockUserService.getUsersByName.mockResolvedValue(null);

            const result = await authService.login(loginDto);

            expect(result).toEqual({ token: 'token' });
            expect(jwtService.sign).toHaveBeenCalledWith({ id: mockUser.id, email: loginDto.user, username:undefined, role: mockUser.role });
        });     

        it('should return a token if credentials with username are valid', async () => {
            const loginDto: LoginDto = { user: 'user_name', password: 'password' };
            const mockUser = { id: 1, email: undefined, username: 'user_name', password: await bcrypt.hash('password', 5), role: 'user' };
        
            mockUserService.getUsersByName.mockResolvedValue(mockUser);
            mockUserService.getUsersByEmail.mockResolvedValue(null);
        
            const result = await authService.login(loginDto);
        
            expect(result).toEqual({ token: 'token' });
            expect(jwtService.sign).toHaveBeenLastCalledWith({ id: mockUser.id, username: loginDto.user, email: undefined, role: mockUser.role });
        });  

        it('should throw an exception if credentials are invalid', async () => {
            const loginDto: LoginDto = { user: 'test@example.com', password: 'wrongpassword' };
            mockUserService.getUsersByEmail.mockResolvedValue(null);
            mockUserService.getUsersByName.mockResolvedValue(null);

            await expect(authService.login(loginDto)).rejects.toThrow(new HttpException('Неправильный email или пароль', HttpStatus.UNAUTHORIZED));
        });
 
    });

    describe('register', () => {
        it('should register a new user and return a token', async () => {
            const registerDto: CreateUserDto = { email: 'test@example.com', password: 'password', username: 'user' };
            const hashedPassword = await bcrypt.hash(registerDto.password, 5);
            const mockUser = { id: 1, email: registerDto.email, role: 'user' };

            mockUserService.getUsersByEmail.mockResolvedValue(null);
            mockUserService.createUser.mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'hash').mockImplementation(async (data: string, salt: string | number) => {
                return Promise.resolve(hashedPassword); // Возвращаем ожидаемый хеш
            });
            

            const result = await authService.register(registerDto);

            expect(result).toEqual({ token: 'token' });
            expect(mockUserService.createUser).toHaveBeenCalledWith({ ...registerDto, password: hashedPassword });
        });

        it('should throw an exception if the user already exists', async () => {
            const registerDto: CreateUserDto = { email: 'test@example.com', password: 'password', username: 'user' };
            mockUserService.getUsersByEmail.mockResolvedValue({}); // Имитация существующего пользователя

            await expect(authService.register(registerDto)).rejects.toThrow(new HttpException('Пользователь с таким email уже зарегистрирован', HttpStatus.BAD_REQUEST));
        });
    });

    describe('updateUser', () => {
        it('should update the user and return the updated user', async () => {
            const updateDto: UpdateUserDto = { username: 'updatedUser', password: 'newPassword' };
            const hashedPassword = await bcrypt.hash(updateDto.password, 5);
            const mockUser = { id: 1, email: 'test@example.com', password: hashedPassword, role: 'user' };

            mockUserService.getUserById.mockResolvedValue(mockUser);jest.spyOn(bcrypt, 'hash').mockImplementation(async (data: string, salt: string | number) => {
                return Promise.resolve(hashedPassword); // Возвращаем ожидаемый хеш
            });
            
            mockUserService.updateUser.mockResolvedValue(true); // Имитация успешного обновления

            const result = await authService.updateUser(updateDto, 1);

            expect(result).toEqual(mockUser);
            expect(mockUserService.updateUser).toHaveBeenCalledWith(updateDto.username, hashedPassword, 1);
        });

        it('should throw an exception if user not found', async () => {
            const updateDto: UpdateUserDto = { username: 'updatedUser', password: 'newPassword' };
            mockUserService.getUserById.mockResolvedValue(null); // Имитация отсутствующего пользователя

            await expect(authService.updateUser(updateDto, 1)).rejects.toThrow(new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND));
        });
    });
});