import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User } from '../database/models/users.model';
import { getModelToken } from '@nestjs/sequelize';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Role } from 'src/common/enums/roles.enum';

describe('UsersService', () => {
  let usersService: UsersService;
  let mockUserRepository;

  beforeEach(async () => {
    mockUserRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      destroy: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User), useValue: mockUserRepository },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  it('should create a user', async () => {
    const dto = { username: 'testuser', email: 'test@example.com', password: 'password123' };
    const createdUser = { id: 1, ...dto, role: Role.User, save: jest.fn().mockResolvedValue(true) }; // Замокать метод save
  
    mockUserRepository.create.mockResolvedValue(createdUser);
  
    const result = await usersService.createUser(dto);
  
    expect(mockUserRepository.create).toHaveBeenCalledWith(dto);
    expect(createdUser.save).toHaveBeenCalled();
    expect(result).toEqual(createdUser);
  });  

  it('should assign a role to a user', async () => {
    const dto = { id: 1, role: Role.Admin };
    const foundUser = { id: 1, role: Role.User, save: jest.fn() };

    mockUserRepository.findOne.mockResolvedValue(foundUser);

    const result = await usersService.assignRole(dto);

    expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: dto.id } });
    expect(foundUser.role).toBe(dto.role);
    expect(foundUser.save).toHaveBeenCalled();
    expect(result).toEqual(foundUser);
  });

  it('should return all users', async () => {
    const users = [{ id: 1, username: 'test1' }, { id: 2, username: 'test2' }];

    mockUserRepository.findAll.mockResolvedValue(users);

    const result = await usersService.getAllUsers();

    expect(mockUserRepository.findAll).toHaveBeenCalled();
    expect(result).toEqual(users);
  });

  it('should return a user by email', async () => {
    const email = 'test@example.com';
    const user = { id: 1, email };

    mockUserRepository.findOne.mockResolvedValue(user);

    const result = await usersService.getUsersByEmail(email);

    expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email } });
    expect(result).toEqual(user);
  });

  it('should return a user by name', async () => {
    const username = 'testuser';
    const user = { id: 1, username };

    mockUserRepository.findOne.mockResolvedValue(user);

    const result = await usersService.getUsersByName(username);

    expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { username } });
    expect(result).toEqual(user);
  });

  it('should return a user by ID', async () => {
    const id = 1;
    const user = { id, username: 'testuser' };

    mockUserRepository.findOne.mockResolvedValue(user);

    const result = await usersService.getUserById(id);

    expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(result).toEqual(user);
  });

  it('should delete a user successfully', async () => {
    const id = 1;

    mockUserRepository.destroy.mockResolvedValue(1); // Успешное удаление

    const result = await usersService.deleteUser(id);

    expect(mockUserRepository.destroy).toHaveBeenCalledWith({ where: { id } });
    expect(result).toBe(`Пользователь с id ${id} удален.`);
  });

  it('should throw an error if user to delete does not exist', async () => {
    const id = 999;
  
    mockUserRepository.destroy.mockResolvedValue(0); // Пользователь не найден
  
    await expect(usersService.deleteUser(id)).rejects.toThrow('Пользователь не найден');
    expect(mockUserRepository.destroy).toHaveBeenCalledWith({ where: { id } });
  });  

  it('should update a user', async () => {
    const id = 1;
    const updatedFields = { username: 'updateduser', password: 'newpassword' };
    const result = [1]; // Sequelize возвращает массив: [количество обновленных записей]

    mockUserRepository.update.mockResolvedValue(result);

    const updateResult = await usersService.updateUser(updatedFields.username, updatedFields.password, id);

    expect(mockUserRepository.update).toHaveBeenCalledWith(updatedFields, { where: { id } });
    expect(updateResult).toEqual(result);
  });
});