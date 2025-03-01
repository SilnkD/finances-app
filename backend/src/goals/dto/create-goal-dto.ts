import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsNumber, IsDateString } from "class-validator";

export class CreateGoalDto {
    @ApiProperty({ example: 'Поездка на море', description: 'Название цели' })
    @IsString({ message: 'Название должно быть строкой' })
    @Length(2, 128, { message: 'Цель должна содержать от 2 до 128 символов' })
    readonly name: string;

    @ApiProperty({ example: '1000', description: 'Размер финансовой цели (BYN)' })
    @IsNumber({}, { message: 'Размер финансовой цели должен быть числовым значением' })
    readonly target_amount: number;

    @ApiProperty({ example: new Date(), description: 'Дата начала накоплений' })
    @IsDateString({}, { message: 'Дата начала должна быть датой'})
    readonly start_date: string;

    @ApiProperty({ example: new Date(), description: 'Дата начала накоплений' })
    @IsDateString({}, { message: 'Финальная дата должна быть датой' })
    readonly end_date: string;

    @ApiProperty({ example: '1', description: 'ID счета' })
    @IsNumber({}, { message: 'ID счета должен быть числом' })
    readonly budget_id: number;
}