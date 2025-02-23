import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length } from "class-validator";

export class CreateUserDto {
    @ApiProperty({example: 'username example', description: 'Имя пользователя'})
    @IsString({message:'Имя должно быть строкой'})
    @Length(8,128, {message: 'Имя должно содержать от 8 до 128 символов'})
    readonly username: string;

    @ApiProperty({example: 'example@gmail.com', description: 'Электронная почта'})
    @IsString({message:'Email должен быть строкой'})
    @IsEmail({}, {message: 'Некорректный email'})
    readonly email: string;

    @ApiProperty({example: 'password123', description: 'Пароль'})
    @Length(8,32, {message: 'Пароль должен содержать от 8 до 32 символов'})
    readonly password: string;
}