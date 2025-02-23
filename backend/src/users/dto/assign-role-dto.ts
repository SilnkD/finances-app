import { ApiProperty } from "@nestjs/swagger";
import { Role } from "../../common/enums/roles.enum";
import { IsEnum, IsNotEmpty, IsNumber } from "class-validator";

export class AssignRoleDto {
    @ApiProperty({example: '1', description: 'Уникальный идентификатор'})
    @IsNumber({}, {message:'ID пользователя должен быть числом'})
    @IsNotEmpty()
    readonly id: number;

    @ApiProperty({example: 'USER', description: 'Роль пользователя'})
    @IsEnum(Role, {message:'Ролью пользователя может быть только USER или ADMIN'})
    @IsNotEmpty()
    readonly role: Role;
}