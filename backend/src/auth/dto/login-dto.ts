import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class LoginDto {
    @ApiProperty({example: 'username example', description: 'Имя пользователя'})
    @IsString({message:'Имя пользователя или email должны быть строкой'})
    @Length(8,128, {message: 'Имя или email должны содержать от 8 до 128 символов'})
    readonly user: string;

    @ApiProperty({example: 'password123', description: 'Пароль'})
    @Length(8,32, {message: 'Пароль должен содержать от 8 до 32 символов'})
    readonly password: string;
}