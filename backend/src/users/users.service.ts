import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from '../database/models/users.model';
import { InjectModel } from '@nestjs/sequelize';
import { CreateUserDto } from './dto/create-user-dto';
import { AssignRoleDto } from './dto/assign-role-dto';
import { Role } from 'src/common/enums/roles.enum';

@Injectable()
export class UsersService {

    constructor(@InjectModel(User) private userRepository: typeof User) {}

    async createUser(dto: CreateUserDto) {
        const user = await this.userRepository.create(dto);
        user.role = Role.User;
        await user.save();
        return user;
    }

    async assignRole(dto:AssignRoleDto) {
        const id = dto.id;
        const user = await this.userRepository.findOne({where:{id}});
        if (user) {
            user.role = dto.role;
            await user.save();
        }
        return user;
    }

    async getAllUsers() {
        const users = await this.userRepository.findAll(); //.findAll({include:{all:true}});
        return users;
    }

    async getUsersByEmail(email: string) {
        const user = await this.userRepository.findOne({where:{email}});
        return user;
    }

    async getUsersByName(username: string) {
        const user = await this.userRepository.findOne({where:{username}});
        return user;
    }

    async getUserById(id: number) {
        const user = await this.userRepository.findOne({where:{id}});
        return user;
    }

    async deleteUser(id: number) {
        const user = await this.userRepository.destroy({where:{id}});
        if (user>0)
            return `Пользователь с id ${id} удален.`;
        else return new HttpException('Невалидный токен', HttpStatus.NOT_FOUND)
    }

    async updateUser(username: string, password: string, id: number) {
        const user = await this.userRepository.update({username, password}, {where:{id}});
        return user;
    }
}
