import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsDate, IsNumber, IsDateString } from "class-validator";

export class CreateGoalDto {
    @ApiProperty({ example: 'Поездка на море', description: 'Название цели' })
    @IsString({ message: 'Название должно быть строкой' })
    @Length(2, 128, { message: 'Цель должна содержать от 2 до 128 символов' })
    readonly name: string;

    @ApiProperty({ example: '1000', description: 'Размер финансовой цели (BYN)' })
    @IsNumber({}, { message: 'Размер финансовой цели должен быть числовым значением' })
    readonly target_amount: number;

    @ApiProperty({ example: '800', description: 'Текущие накопления (BYN)' })
    @IsNumber({}, { message: 'Текущий размер финансовой цели должен быть числом' })
    readonly current_amount: number;

    @ApiProperty({ example: new Date(), description: 'Дата начала накоплений' })
    @IsDateString({}, { message: 'Дата начала должна быть датой'})
    readonly start_date: string;

    @ApiProperty({ example: new Date(), description: 'Дата начала накоплений' })
    @IsDateString({}, { message: 'Финальная дата должна быть датой' })
    readonly end_date: string;

    @ApiProperty({ example: new Date(), description: 'ID категории' })
    @IsNumber({}, { message: 'ID категории должен быть числом' })
    readonly category_id: number;
}