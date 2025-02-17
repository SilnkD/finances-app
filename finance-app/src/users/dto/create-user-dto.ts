import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty } from "class-validator";

export class CreateUserDto {
    @ApiProperty({example: 'example@gmail.com', description: 'Электронная почта'})
    @IsEmail()
    @IsNotEmpty()
    readonly email: string;

    @ApiProperty({example: 'password123', description: 'Пароль'})
    @IsNotEmpty()
    readonly password: string;
}