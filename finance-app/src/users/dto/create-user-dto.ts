import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
    @ApiProperty({example: 'example@gmail.com', description: 'Электронная почта'})
    readonly email: string;

    @ApiProperty({example: 'password123', description: 'Пароль'})
    readonly password: string;
}