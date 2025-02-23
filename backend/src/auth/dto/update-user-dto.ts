import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class UpdateUserDto {
    @ApiProperty({example: 'username example', description: 'Имя пользователя'})
    @IsString({message:'Имя должно быть строкой'})
    @Length(8,128, {message: 'Имя должно содержать от 8 до 128 символов'})
    readonly username: string;

    @ApiProperty({example: 'password123', description: 'Пароль'})
    @Length(8,32, {message: 'Пароль должен содержать от 8 до 32 символов'})
    readonly password: string;
}