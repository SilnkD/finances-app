import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from './users.model';
import { RolesGuard } from './roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/roles.enum';
import { AssignRoleDto } from './dto/assign-role-dto';

@ApiTags('Пользователи')
@Controller('users')
export class UsersController {

    constructor(private usersService: UsersService) {}

    @ApiOperation({summary: 'ADMIN/Назначение роли'})
    @ApiResponse({status: 200, type: User})
    @ApiBearerAuth()
    @Roles(Role.Admin)
    @UseGuards(RolesGuard)
    @Post('assign-role')
    assignRole(@Body() roleDto: AssignRoleDto) {
        return this.usersService.assignRole(roleDto);
    }

    @ApiOperation({summary: 'ADMIN/Получение всех пользователей'})
    @ApiResponse({status: 200, type: [User]})
    @ApiBearerAuth()
    @Roles(Role.Admin)
    @UseGuards(RolesGuard)
    @Get('all')
    @Get()
    async getUsers(): Promise<User[]> {
        return this.usersService.getAllUsers();
    }

    @ApiOperation({ summary: 'ADMIN/Удаление пользователя' })
    @ApiResponse({ status: 200, type: Number })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'ID пользователя', type: Number, example: 1 })
    @Roles(Role.Admin)
    @UseGuards(RolesGuard)
    @Delete('delete/:id')
    async deleteUser(@Param('id') id: string) {
        return this.usersService.deleteUser(Number(id));
    }
}