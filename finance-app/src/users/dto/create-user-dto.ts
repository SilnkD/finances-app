import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class CreateUserDto {
    @ApiProperty({example: 'example@gmail.com', description: 'Электронная почта'})
    @IsString({message:'Email должен быть строкой'})
    @IsEmail({}, {message: 'Некорректный email'})
    readonly email: string;

    @ApiProperty({example: 'password123', description: 'Пароль'})
    @Length(8,32, {message: 'Пароль должен быть от 8 до 32 символов'})
    readonly password: string;
}