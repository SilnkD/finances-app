import { HttpException, HttpStatus } from "@nestjs/common";
import { TestingModule, Test } from "@nestjs/testing";
import { Role } from "src/common/enums/roles.enum";
import { RolesGuard } from "src/common/guards/roles.guard";
import { AssignRoleDto } from "./dto/assign-role-dto";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";

describe('UsersController', () => {
    let usersController: UsersController;
    let usersService: UsersService;
  
    const mockUsersService = {
      assignRole: jest.fn(),
      getAllUsers: jest.fn(),
      deleteUser: jest.fn(),
    };

    
    const mockJwtService = {
      verify: jest.fn().mockReturnValue({ id: 1, role: Role.Admin }), // Верификация JWT
    };
  
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [UsersController],
        providers: [
            { provide: UsersService, useValue: mockUsersService },
            { provide: JwtService, useValue: mockJwtService },
            { provide: Reflector, useValue: { get: jest.fn() } },
            RolesGuard,
        ],
      }).compile();
  
      usersController = module.get<UsersController>(UsersController);
      usersService = module.get<UsersService>(UsersService);
    });
  
    it('should assign a role to a user', async () => {
      const dto: AssignRoleDto = { id: 1, role: Role.User };
      mockUsersService.assignRole.mockResolvedValue({ id: 1, role: Role.User });
  
      const result = await usersController.assignRole(dto);
  
      expect(usersService.assignRole).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 1, role: Role.User });
    });
  
    it('should return all users', async () => {
      mockUsersService.getAllUsers.mockResolvedValue([
        {
          id: 1,
          username: 'Test User',
          email: 'example@gmail.com',
          role: Role.Admin,
        },
      ]);
  
      const result = await usersController.getUsers();
  
      expect(usersService.getAllUsers).toHaveBeenCalled();
      expect(result).toEqual([
        {
          id: 1,
          username: 'Test User',
          email: 'example@gmail.com',
          role: Role.Admin,
        },
      ]);
    });
  
    it('should delete a user', async () => {
      mockUsersService.deleteUser.mockResolvedValue('Пользователь с id 1 удален.');
  
      const result = await usersController.deleteUser('1');
  
      expect(usersService.deleteUser).toHaveBeenCalledWith(1);
      expect(result).toBe('Пользователь с id 1 удален.');
    });
  
    it('should throw error when deleting non-existent user', async () => {
      mockUsersService.deleteUser.mockRejectedValue(
        new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND),
      );
  
      await expect(usersController.deleteUser('999')).rejects.toThrow(
        'Пользователь не найден',
      );
    });
  
  });