import { ApiProperty } from "@nestjs/swagger";
import { Role } from "../../roles/roles.enum";
import { IsEnum, IsNotEmpty } from "class-validator";

export class AssignRoleDto {
    @ApiProperty({example: '1', description: 'Уникальный идентификатор'})
    @IsNotEmpty()
    readonly id: number;

    @ApiProperty({example: 'USER', description: 'Роль пользователя'})
    @IsEnum(Role)
    readonly role: Role;
}