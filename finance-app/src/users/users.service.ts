import { Injectable } from '@nestjs/common';
import { User } from './users.model';
import { InjectModel } from '@nestjs/sequelize';
import { CreateUserDto } from './dto/create-user-dto';
import { AssignRoleDto } from './dto/assign-role-dto';
import { Role } from 'src/roles/roles.enum';

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
}
