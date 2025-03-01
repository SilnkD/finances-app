import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, IsNumber, IsDate } from "class-validator";

export class GetGoalDto {
    @ApiProperty({ example: '1', description: 'ID цели' })
    @IsNumber({}, { message: 'ID цели должен быть числовым значением' })
    readonly id: number;

    @ApiProperty({ example: 'Путешествие', description: 'Название категории' })
    @IsString({ message: 'Название категории должно быть строкой' })
    readonly category_name: String;

    @ApiProperty({ example: '1', description: 'ID пользователя' })
    @IsNumber({}, { message: 'ID пользователя должен быть числовым значением' })
    readonly user_id: number;

    @ApiProperty({ example: 'Поездка на море', description: 'Название цели' })
    @IsString({ message: 'Название должно быть строкой' })
    @Length(2, 128, { message: 'Цель должна содержать от 2 до 128 символов' })
    readonly name: string;

    @ApiProperty({ example: '1000', description: 'Размер финансовой цели (BYN)' })
    @IsNumber({}, { message: 'Размер финансовой цели должен быть числовым значением' })
    readonly target_amount: number;

    @ApiProperty({ example: '1000', description: 'Текущие накопления (BYN)' })
    @IsNumber({}, { message: 'Текущий размер финансовой цели должен быть числом' })
    readonly current_amount: number;

    @ApiProperty({ example: new Date(), description: 'Дата начала накоплений' })
    @IsDate({ message: 'Дата начала должна быть датой' })
    readonly start_date: string;

    @ApiProperty({ example: new Date(), description: 'Дата начала накоплений' })
    @IsDate({ message: 'Финальная дата должна быть датой' })
    readonly end_date: string;
}